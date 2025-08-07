export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface WorkSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isAdminRemark: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string; // User ID
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  timeSpent: number; // in minutes
  isTimerRunning: boolean;
  timerStartedAt?: string;
  tags: string[];
  workSessions: WorkSession[];
  comments: TaskComment[];
}