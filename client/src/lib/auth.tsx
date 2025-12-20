import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { User } from "@shared/schema";
import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    
    // Start polling for user data updates every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchUser();
    }, 2000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const userData = await response.json();
    setUser(userData);
  };

  const register = async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/register", { email, password });
    const userData = await response.json();
    setUser(userData);
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    queryClient.clear();
  };

  const refetchUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
