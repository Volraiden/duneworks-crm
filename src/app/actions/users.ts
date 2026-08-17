"use server";

import bcrypt from "bcryptjs";
import { assertCan, requireUser } from "@/lib/guard";
import { isRole, type Role } from "@/lib/permissions";
import { mapTeamMember } from "@/lib/mappers";
import type { TeamMember } from "@/lib/types";

export async function listUsers(): Promise<TeamMember[]> {
  const { prisma, role } = await requireUser();
  assertCan(role, "manageUsers");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return users.map(mapTeamMember);
}

export async function saveUser(input: {
  id?: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  active?: boolean;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { prisma, role, actor } = await requireUser();
  assertCan(role, "manageUsers");

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email) return { ok: false, error: "Name and email are required." };
  if (!isRole(input.role)) return { ok: false, error: "Choose a valid role." };

  if (input.id) {
    const existing = await prisma.user.findUnique({ where: { id: input.id } });
    if (!existing) return { ok: false, error: "User not found." };
    if (existing.id === actor.id && input.active === false) {
      return { ok: false, error: "You cannot deactivate your own account." };
    }
    if (existing.id === actor.id && input.role !== "Admin") {
      return { ok: false, error: "You cannot remove your own admin access." };
    }

    const data: {
      name: string;
      email: string;
      role: Role;
      active?: boolean;
      passwordHash?: string;
    } = { name, email, role: input.role, active: input.active ?? existing.active };

    if (input.password) {
      if (input.password.length < 8) {
        return { ok: false, error: "Password must be at least 8 characters." };
      }
      data.passwordHash = await bcrypt.hash(input.password, 12);
    }

    const row = await prisma.user.update({ where: { id: input.id }, data });
    return { ok: true, id: row.id };
  }

  if (!input.password || input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) return { ok: false, error: "That email is already in use." };

  const row = await prisma.user.create({
    data: {
      name,
      email,
      role: input.role,
      active: input.active ?? true,
      passwordHash: await bcrypt.hash(input.password, 12),
    },
  });
  return { ok: true, id: row.id };
}

export async function deleteUser(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { prisma, role, actor } = await requireUser();
  assertCan(role, "manageUsers");
  if (id === actor.id) return { ok: false, error: "You cannot delete your own account." };

  const admins = await prisma.user.count({
    where: { role: "Admin", active: true, id: { not: id } },
  });
  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === "Admin" && admins === 0) {
    return { ok: false, error: "Keep at least one admin on the studio." };
  }

  await prisma.user.delete({ where: { id } });
  return { ok: true };
}
