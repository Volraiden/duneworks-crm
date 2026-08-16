import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getSqliteFilePath() {
  const raw = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const relative = raw.replace(/^file:/, "");
  if (path.isAbsolute(relative)) return relative;
  return path.join(/* turbopackIgnore: true */ process.cwd(), "prisma", "dev.db");
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: getSqliteFilePath() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
