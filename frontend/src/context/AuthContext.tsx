import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api.js";

export type UserRole = "admin" | "user";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  token: string;
  pointsBalance?: number;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored =
        sessionStorage.getItem("auth_user") ||
        localStorage.getItem("auth_user");
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((authUser: AuthUser, rememberMe = false) => {
    setUser(authUser);
    const serialized = JSON.stringify(authUser);
    if (rememberMe) {
      sessionStorage.removeItem("auth_user");
      localStorage.setItem("auth_user", serialized);
    } else {
      localStorage.removeItem("auth_user");
      sessionStorage.setItem("auth_user", serialized);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_user");
    sessionStorage.removeItem("auth_user");
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      const serialized = JSON.stringify(updated);
      if (localStorage.getItem("auth_user")) {
        localStorage.setItem("auth_user", serialized);
      } else {
        sessionStorage.setItem("auth_user", serialized);
      }
      return updated;
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get<{
        success: boolean;
        data: { user: Partial<AuthUser> };
      }>("/api/auth/me");
      if (res.data?.data?.user) {
        updateUser(res.data.data.user);
      }
    } catch {
      // Ignore background refresh failure
    }
  }, [updateUser]);

  // Refresh profile on mount if token is present
  useEffect(() => {
    if (user?.token) {
      refreshProfile();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
