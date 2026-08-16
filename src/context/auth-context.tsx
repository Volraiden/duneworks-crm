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
import {
  getAuthStatus,
  loginStudio,
  logoutStudio,
  registerStudio,
} from "@/app/actions/auth";
import type { SessionUser } from "@/lib/session-token";

interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  needsSetup: boolean;
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    studioName: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authenticated, setIsAuthed] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  const refresh = useCallback(async () => {
    const status = await getAuthStatus();
    setIsAuthed(status.authenticated);
    setNeedsSetup(status.needsSetup);
    setUser(status.user);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginStudio({ email, password });
    if (!result.ok) return false;
    await refresh();
    return true;
  }, [refresh]);

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      studioName: string;
    }) => {
      const result = await registerStudio(input);
      if (!result.ok) return { ok: false, error: result.error };
      await refresh();
      return { ok: true };
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await logoutStudio();
    setIsAuthed(false);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      ready,
      authenticated,
      needsSetup,
      user,
      login,
      register,
      logout,
    }),
    [authenticated, login, logout, needsSetup, ready, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
