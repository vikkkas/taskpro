export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface WorkSession {
  _id: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  userId?: string; // Track which user worked on this session
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
  assignee: string | { _id: string; id?: string; name: string; email: string; department: string; avatar?: string; } | undefined; // User ID or populated User object (backward compatibility)
  assignees: Array<string | { _id: string; id?: string; name: string; email: string; department: string; avatar?: string; }>; // Multiple assignees - can be IDs or populated objects
  createdBy?: string | { _id: string; id?: string; name: string; email: string; department: string; avatar?: string; };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  timeSpent: number; // in minutes
  isTimerRunning: boolean;
  timerStartedAt?: string;
  timerStartedBy?: string | { _id: string; id?: string; name: string; email: string; department: string; avatar?: string; }; // Track who started the timer
  tags: string[];
  workSessions: WorkSession[];
  comments: TaskComment[];
}

// Admin-specific types for analytics and active timers
export interface ActiveTimer extends Task {
  currentSessionDuration: number;
  totalTimeSpent: number;
}

export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  activeTimers: number;
  overdueTasks: number;
  completionRate: number;
  tasksByAssignee: Array<{
    _id: string;
    count: number;
    name: string;
    email: string;
    department: string;
  }>;
}