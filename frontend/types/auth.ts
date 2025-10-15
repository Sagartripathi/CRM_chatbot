/**
 * Authentication-related TypeScript types
 */

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (userData: UserCreate) => Promise<RegisterResult>;
  logout: () => void;
  loading: boolean;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
}

// Re-export User type from api.ts
import { User, UserCreate } from "./api";
export type { User, UserCreate };
