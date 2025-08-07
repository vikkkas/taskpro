export type UserRole = 'admin' | 'team-member';

export interface User {
  id: string;
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