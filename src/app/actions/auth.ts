"use server";

import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  getSession,
  setSessionCookie,
  type SessionUser,
} from "@/lib/session";
import { normalizeRole } from "@/lib/permissions";

export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  user: SessionUser | null;
}> {
  const prisma = await getPrisma();
  const session = await getSession();
  if (!session) return { authenticated: false, user: null };

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.active) {
    await clearSessionCookie();
    return { authenticated: false, user: null };
  }

  return {
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
    },
  };
}

export async function loginStudio(input: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const prisma = await getPrisma();
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return { ok: false, error: "invalid" };

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) return { ok: false, error: "invalid" };

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
  });

  return { ok: true };
}

export async function logoutStudio() {
  await clearSessionCookie();
}
