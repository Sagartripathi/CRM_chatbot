/**
 * TypeScript version of AuthContext with full type safety
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios, { AxiosResponse } from "axios";
import { User, LoginRequest, LoginResponse, UserCreate } from "../../types/api";
import { AuthContextType, LoginResult, RegisterResult } from "../../types/auth";
import { API_BASE_URL } from "../config";

// Create axios instance with base URL and request interceptor for automatic token injection
const apiClient = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, '')}/api`,
});

// Request interceptor to add token to all requests and ensure trailing slashes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure URL has trailing slash to avoid redirects that lose auth headers
    if (config.url && !config.url.includes("?") && !config.url.endsWith("/")) {
      config.url = config.url + "/";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  useEffect(() => {
    // Check if user is logged in on app load
    const checkAuth = async (): Promise<void> => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const response: AxiosResponse<User> = await apiClient.get("/auth/me");
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResult> => {
    try {
      const loginData: LoginRequest = { email, password };
      const response: AxiosResponse<LoginResponse> = await apiClient.post(
        "/auth/login",
        loginData
      );
      const { access_token, user: userData } = response.data;

      localStorage.setItem("token", access_token);
      setToken(access_token);
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || "Login failed",
      };
    }
  };

  const register = async (userData: UserCreate): Promise<RegisterResult> => {
    try {
      await apiClient.post("/auth/register", userData);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || "Registration failed",
      };
    }
  };

  const logout = (): void => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export the configured axios instance for use in components
export { apiClient };
