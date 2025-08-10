export type UserRole = 'admin' | 'team-member';

export interface User {
  id?: string;  // For static data compatibility
  _id?: string; // For backend API response
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}