"use server";

import { existsSync, statSync } from "node:fs";
import os from "node:os";
import { getSession } from "@/lib/session";
import { getSqliteFilePath, prisma } from "@/lib/prisma";

export interface DatabaseStatus {
  healthy: boolean;
  latencyMs: number;
  engine: string;
  provider: string;
  hosting: string;
  environment: string;
  hostname: string;
  filePath: string;
  fileExists: boolean;
  sizeBytes: number;
  lastModified: string | null;
  checkedAt: string;
  latestMigration: string | null;
  tables: {
    users: number;
    clients: number;
    projects: number;
    payments: number;
    events: number;
  };
  error?: string;
}

function hostingLabel() {
  if (process.env.VERCEL) return "Vercel";
  if (process.env.NODE_ENV === "production") return "Production host";
  return "Local machine";
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const filePath = getSqliteFilePath();
  const fileExists = existsSync(filePath);
  const fileStats = fileExists ? statSync(filePath) : null;
  const started = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - started;

    const [users, clients, projects, payments, events, migrations] =
      await Promise.all([
        prisma.user.count(),
        prisma.client.count(),
        prisma.project.count(),
        prisma.payment.count(),
        prisma.calendarEvent.count(),
        prisma.$queryRaw<
          { migration_name: string }[]
        >`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 1`,
      ]);

    return {
      healthy: true,
      latencyMs,
      engine: "SQLite",
      provider: "Prisma",
      hosting: hostingLabel(),
      environment: process.env.NODE_ENV === "production" ? "Production" : "Development",
      hostname: os.hostname(),
      filePath,
      fileExists,
      sizeBytes: fileStats?.size ?? 0,
      lastModified: fileStats?.mtime.toISOString() ?? null,
      checkedAt: new Date().toISOString(),
      latestMigration: migrations[0]?.migration_name ?? null,
      tables: { users, clients, projects, payments, events },
    };
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - started,
      engine: "SQLite",
      provider: "Prisma",
      hosting: hostingLabel(),
      environment: process.env.NODE_ENV === "production" ? "Production" : "Development",
      hostname: os.hostname(),
      filePath,
      fileExists,
      sizeBytes: fileStats?.size ?? 0,
      lastModified: fileStats?.mtime.toISOString() ?? null,
      checkedAt: new Date().toISOString(),
      latestMigration: null,
      tables: { users: 0, clients: 0, projects: 0, payments: 0, events: 0 },
      error: error instanceof Error ? error.message : "Database unreachable",
    };
  }
}
