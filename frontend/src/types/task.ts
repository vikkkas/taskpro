export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface WorkSession {
  _id: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
}

export interface TaskComment {
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isAdminRemark: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | { _id: string; id?: string; name: string; email: string; department: string; avatar?: string; } | undefined; // User ID or populated User object
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