import { getPrisma } from "@/lib/prisma";
import { getSession, type SessionUser } from "@/lib/session";
import { can, normalizeRole, type Permission, type Role } from "@/lib/permissions";

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new ActionError("Unauthorized");
  const prisma = await getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.active) throw new ActionError("Unauthorized");
  const role = normalizeRole(user.role);
  const actor: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
  };
  return { prisma, user, actor, role };
}

export function assertCan(role: Role | string, permission: Permission) {
  if (!can(role, permission)) {
    throw new ActionError("You do not have permission to do that.");
  }
}
