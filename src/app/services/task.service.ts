// src/app/services/task.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
// import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilter, TaskStats } from '../models/task.model';
import { environment } from '../../../SmartRetailer/src/environments/environment.development';
import { CreateTaskRequest, Task, TaskFilter, TaskStats, UpdateTaskRequest } from '../models/task.module';
// import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/api/tasks`;
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private statsSubject = new BehaviorSubject<TaskStats | null>(null);

  // Public observables
  public tasks$ = this.tasksSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all tasks with optional filtering
  getTasks(filter?: TaskFilter): Observable<Task[]> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.priority) params = params.set('priority', filter.priority);
      if (filter.assignedTo) params = params.set('assignedTo', filter.assignedTo.toString());
      if (filter.projectId) params = params.set('projectId', filter.projectId.toString());
      if (filter.dueDateFrom) params = params.set('dueDateFrom', filter.dueDateFrom);
      if (filter.dueDateTo) params = params.set('dueDateTo', filter.dueDateTo);
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
      if (filter.tags && filter.tags.length > 0) {
        params = params.set('tags', filter.tags.join(','));
      }
    }

    return this.http.get<Task[]>(this.apiUrl, { params }).pipe(
      map(tasks => {
        // Convert date strings to Date objects
        const processedTasks = tasks.map(task => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        }));
        
        this.tasksSubject.next(processedTasks);
        return processedTasks;
      })
    );
  }

  // Get task by ID
  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`).pipe(
      map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt)
      }))
    );
  }

  // Create new task
  createTask(taskData: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, taskData).pipe(
      map(task => {
        const processedTask = {
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        };
        
        // Update local tasks list
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next([...currentTasks, processedTask]);
        
        return processedTask;
      })
    );
  }

  // Update existing task
  updateTask(taskData: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${taskData.id}`, taskData).pipe(
      map(task => {
        const processedTask = {
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        };
        
        // Update local tasks list
        const currentTasks = this.tasksSubject.value;
        const updatedTasks = currentTasks.map(t => 
          t.id === processedTask.id ? processedTask : t
        );
        this.tasksSubject.next(updatedTasks);
        
        return processedTask;
      })
    );
  }

  // Delete task
  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        // Update local tasks list
        const currentTasks = this.tasksSubject.value;
        const filteredTasks = currentTasks.filter(t => t.id !== id);
        this.tasksSubject.next(filteredTasks);
      })
    );
  }

  // Get task statistics
  getTaskStats(): Observable<TaskStats> {
    return this.http.get<TaskStats>(`${this.apiUrl}/stats`).pipe(
      map(stats => {
        this.statsSubject.next(stats);
        return stats;
      })
    );
  }

  // Update task status
  updateTaskStatus(id: number, status: Task['status']): Observable<Task> {
    return this.updateTask({ id, status });
  }

  // Update task priority
  updateTaskPriority(id: number, priority: Task['priority']): Observable<Task> {
    return this.updateTask({ id, priority });
  }

  // Assign task to user
  assignTask(id: number, assignedTo: number): Observable<Task> {
    return this.updateTask({ id, assignedTo });
  }

  // Get tasks assigned to current user
  getMyTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/my-tasks`).pipe(
      map(tasks => tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt)
      })))
    );
  }

  // Get overdue tasks
  getOverdueTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/overdue`).pipe(
      map(tasks => tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt)
      })))
    );
  }

  // Get tasks by project
  getTasksByProject(projectId: number): Observable<Task[]> {
    return this.getTasks({ projectId });
  }

  // Search tasks
  searchTasks(searchTerm: string): Observable<Task[]> {
    return this.getTasks({ searchTerm });
  }

  // Bulk update tasks
  bulkUpdateTasks(taskIds: number[], updates: Partial<CreateTaskRequest>): Observable<Task[]> {
    return this.http.put<Task[]>(`${this.apiUrl}/bulk-update`, {
      taskIds,
      updates
    }).pipe(
      map(tasks => {
        const processedTasks = tasks.map(task => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        }));
        
        // Update local tasks list
        const currentTasks = this.tasksSubject.value;
        const updatedTasks = currentTasks.map(currentTask => {
          const updatedTask = processedTasks.find(t => t.id === currentTask.id);
          return updatedTask || currentTask;
        });
        this.tasksSubject.next(updatedTasks);
        
        return processedTasks;
      })
    );
  }

  // Export tasks to CSV
  exportTasks(filter?: TaskFilter): Observable<Blob> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.priority) params = params.set('priority', filter.priority);
      if (filter.assignedTo) params = params.set('assignedTo', filter.assignedTo.toString());
      if (filter.projectId) params = params.set('projectId', filter.projectId.toString());
      if (filter.dueDateFrom) params = params.set('dueDateFrom', filter.dueDateFrom);
      if (filter.dueDateTo) params = params.set('dueDateTo', filter.dueDateTo);
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Helper methods for local state management
  getCurrentTasks(): Task[] {
    return this.tasksSubject.value;
  }

  getCurrentStats(): TaskStats | null {
    return this.statsSubject.value;
  }

  // Clear local state
  clearTasks(): void {
    this.tasksSubject.next([]);
    this.statsSubject.next(null);
  }
}