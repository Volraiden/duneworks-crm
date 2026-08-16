"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  getSession,
  setSessionCookie,
  type SessionUser,
} from "@/lib/session";
import { DEFAULT_SETTINGS } from "@/lib/empty-data";

export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  needsSetup: boolean;
  user: SessionUser | null;
}> {
  const userCount = await prisma.user.count();
  const user = await getSession();
  return {
    authenticated: Boolean(user),
    needsSetup: userCount === 0,
    user,
  };
}

export async function registerStudio(input: {
  name: string;
  email: string;
  password: string;
  studioName: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.user.count();
  if (existing > 0) {
    return { ok: false, error: "A studio account already exists." };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const studioName = input.studioName.trim() || "Duneworks Productions";

  if (!name || !email || !input.password) {
    return { ok: false, error: "All fields are required." };
  }
  if (input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "Studio Lead",
    },
  });

  await prisma.studioSettings.create({
    data: {
      id: "studio",
      studioName,
      email,
      phone: DEFAULT_SETTINGS.phone,
      website: DEFAULT_SETTINGS.website,
      address: DEFAULT_SETTINGS.address,
      projectDeadlines: DEFAULT_SETTINGS.notifications.projectDeadlines,
      paymentReminders: DEFAULT_SETTINGS.notifications.paymentReminders,
      newLeads: DEFAULT_SETTINGS.notifications.newLeads,
      weeklyDigest: DEFAULT_SETTINGS.notifications.weeklyDigest,
      appearance: DEFAULT_SETTINGS.appearance,
    },
  });

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return { ok: true };
}

export async function loginStudio(input: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false, error: "invalid" };

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) return { ok: false, error: "invalid" };

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return { ok: true };
}

export async function logoutStudio() {
  await clearSessionCookie();
}
