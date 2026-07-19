import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { authApi } from "@/features/auth/api";
import { tokenStore } from "@/lib/token";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const qc = useQueryClient();

  const loadUser = React.useCallback(async () => {
    if (!tokenStore.access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadUser();
  }, [loadUser]);

  // Forced logout emitted by the axios interceptor on failed refresh.
  React.useEffect(() => {
    const handler = () => {
      tokenStore.clear();
      setUser(null);
      qc.clear();
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [qc]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login(email, password);
      tokenStore.set(tokens.access_token, tokens.refresh_token);
      const me = await authApi.me();
      setUser(me);
      return me;
    },
    [],
  );

  const logout = React.useCallback(() => {
    tokenStore.clear();
    setUser(null);
    qc.clear();
  }, [qc]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      login,
      logout,
      refreshUser: loadUser,
    }),
    [user, loading, login, logout, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
