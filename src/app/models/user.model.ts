// src/app/models/user.model.ts
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  message?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}