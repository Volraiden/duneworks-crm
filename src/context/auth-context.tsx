"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getAuthStatus, loginStudio, logoutStudio } from "@/app/actions/auth";
import { can, type Permission } from "@/lib/permissions";
import type { SessionUser } from "@/lib/session-token";

interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  allow: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authenticated, setIsAuthed] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  const refresh = useCallback(async () => {
    const status = await getAuthStatus();
    setIsAuthed(status.authenticated);
    setUser(status.user);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginStudio({ email, password });
      if (!result.ok) return false;
      await refresh();
      return true;
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await logoutStudio();
    setIsAuthed(false);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const allow = useCallback(
    (permission: Permission) => (user ? can(user.role, permission) : false),
    [user]
  );

  const value = useMemo(
    () => ({
      ready,
      authenticated,
      user,
      login,
      logout,
      allow,
    }),
    [allow, authenticated, login, logout, ready, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
