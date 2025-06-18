// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completedDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  loading = true;
  message = '';
  
  // Task management
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  
  // Filters
  searchTerm = '';
  selectedStatus = '';
  selectedPriority = '';
  selectedDueDate = '';
  sortBy = 'dueDate';
  
  // Modal
  showAddTaskModal = false;
  editingTask: Task | null = null;
  newTask: Partial<Task> = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: ''
  };
  
  stats: DashboardStats = {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  };
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadUserData();
    this.checkForMessages();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthentication(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
    }
  }

  private loadUserData(): void {
    this.currentUser = this.authService.currentUserValue;
    
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.router.navigate(['/login']);
        }
      });
  }

  private checkForMessages(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['message']) {
          this.message = params['message'];
          setTimeout(() => {
            this.message = '';
          }, 5000);
        }
      });
  }

  private loadDashboardData(): void {
    // Simulated task data - in real app, this would come from API
    setTimeout(() => {
      this.tasks = [
        {
          id: 1,
          title: 'Fix login bug',
          description: 'Users are unable to login with correct credentials',
          status: 'todo',
          priority: 'high',
          dueDate: '2025-06-20',
          createdAt: new Date('2025-06-15'),
          updatedAt: new Date('2025-06-15')
        },
        {
          id: 2,
          title: 'Implement user authentication',
          description: 'Add JWT-based authentication system',
          status: 'progress',
          priority: 'high',
          dueDate: '2025-06-22',
          createdAt: new Date('2025-06-14'),
          updatedAt: new Date('2025-06-16')
        },
        {
          id: 3,
          title: 'Setup project structure',
          description: 'Initialize Spring Boot and Angular projects',
          status: 'done',
          priority: 'medium',
          dueDate: '2025-06-18',
          completedDate: '2025-06-17',
          createdAt: new Date('2025-06-12'),
          updatedAt: new Date('2025-06-17')
        },
        {
          id: 4,
          title: 'Update documentation',
          description: 'Update API documentation with new endpoints',
          status: 'todo',
          priority: 'medium',
          dueDate: '2025-06-25',
          createdAt: new Date('2025-06-16'),
          updatedAt: new Date('2025-06-16')
        },
        {
          id: 5,
          title: 'Design task board UI',
          description: 'Create responsive Kanban board interface',
          status: 'progress',
          priority: 'medium',
          dueDate: '2025-06-24',
          createdAt: new Date('2025-06-15'),
          updatedAt: new Date('2025-06-17')
        },
        {
          id: 6,
          title: 'Database schema design',
          description: 'Design PostgreSQL database schema for users and tasks',
          status: 'done',
          priority: 'low',
          dueDate: '2025-06-17',
          completedDate: '2025-06-17',
          createdAt: new Date('2025-06-13'),
          updatedAt: new Date('2025-06-17')
        }
      ];
      
      this.filteredTasks = [...this.tasks];
      this.updateStats();
      this.loading = false;
    }, 1000);
  }

  private updateStats(): void {
    this.stats = {
      totalTasks: this.tasks.length,
      completedTasks: this.tasks.filter(t => t.status === 'done').length,
      pendingTasks: this.tasks.filter(t => t.status !== 'done').length,
      overdueTasks: this.tasks.filter(t => 
        t.status !== 'done' && new Date(t.dueDate) < new Date()
      ).length
    };
  }

  // User methods
  getUserInitials(): string {
    if (!this.currentUser?.username) return 'JD';
    return this.currentUser.username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Task filtering and sorting
  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.tasks];

    // Search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(task => task.status === this.selectedStatus);
    }

    // Priority filter
    if (this.selectedPriority) {
      filtered = filtered.filter(task => task.priority === this.selectedPriority);
    }

    // Due date filter
    if (this.selectedDueDate) {
      filtered = filtered.filter(task => task.dueDate === this.selectedDueDate);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          const statusOrder = { todo: 1, progress: 2, done: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    this.filteredTasks = filtered;
  }

  // Task management
  getTasksByStatus(status: string): Task[] {
    return this.filteredTasks.filter(task => task.status === status);
  }

  getTaskCountByStatus(status: string): number {
    return this.getTasksByStatus(status).length;
  }

  openAddTaskModal(): void {
    this.editingTask = null;
    this.newTask = {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: ''
    };
    this.showAddTaskModal = true;
  }

  closeAddTaskModal(): void {
    this.showAddTaskModal = false;
    this.editingTask = null;
    this.newTask = {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: ''
    };
  }

  editTask(task: Task): void {
    this.editingTask = task;
    this.newTask = { ...task };
    this.showAddTaskModal = true;
  }

  saveTask(): void {
    if (!this.newTask.title || !this.newTask.dueDate) {
      return;
    }

    if (this.editingTask) {
      // Update existing task
      const index = this.tasks.findIndex(t => t.id === this.editingTask!.id);
      if (index !== -1) {
        this.tasks[index] = {
          ...this.tasks[index],
          ...this.newTask,
          updatedAt: new Date(),
          completedDate: this.newTask.status === 'done' ? new Date().toISOString().split('T')[0] : undefined
        } as Task;
      }
    } else {
      // Add new task
      const newTask: Task = {
        id: Math.max(...this.tasks.map(t => t.id)) + 1,
        title: this.newTask.title!,
        description: this.newTask.description || '',
        status: this.newTask.status!,
        priority: this.newTask.priority!,
        dueDate: this.newTask.dueDate!,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedDate: this.newTask.status === 'done' ? new Date().toISOString().split('T')[0] : undefined
      };
      this.tasks.push(newTask);
    }

    this.applyFilters();
    this.updateStats();
    this.closeAddTaskModal();
  }

  deleteTask(taskId: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.applyFilters();
      this.updateStats();
    }
  }

  // Utility methods
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}