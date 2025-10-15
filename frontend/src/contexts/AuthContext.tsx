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

  // Ensure axios Authorization header is present immediately from localStorage
  // This avoids a short race where components make requests before the
  // React effect runs and sets axios.defaults.headers.common["Authorization"].
  try {
    const _stored = localStorage.getItem("token");
    if (_stored) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${_stored}`;
    }
  } catch (e) {
    // localStorage may not be available in some execution contexts; ignore
  }

  useEffect(() => {
    // Set axios default authorization header
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  useEffect(() => {
    // Check if user is logged in on app load
    const checkAuth = async (): Promise<void> => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedToken}`;
          const response: AxiosResponse<User> = await axios.get("/auth/me");
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
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
      const response: AxiosResponse<LoginResponse> = await axios.post(
        "/auth/login",
        loginData
      );
      const { access_token, user: userData } = response.data;

      localStorage.setItem("token", access_token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
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
      await axios.post("/auth/register", userData);
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
    delete axios.defaults.headers.common["Authorization"];
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
