// src/app/models/task.model.ts
export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  completedDate?: string;
  assignedTo?: number; // User ID
  projectId?: number;
  tags?: string[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: number; // User ID
}

export type TaskStatus = 'todo' | 'progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskAttachment {
  id: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy: number; // User ID
}

export interface TaskComment {
  id: number;
  content: string;
  createdAt: Date;
  createdBy: number; // User ID
  updatedAt?: Date;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedTo?: number;
  projectId?: number;
  tags?: string[];
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: number;
  projectId?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
  tags?: string[];
  searchTerm?: string;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  tasksByStatus: {
    todo: number;
    progress: number;
    done: number;
    blocked: number;
  };
}