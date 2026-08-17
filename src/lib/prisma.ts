import { copyFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaReady?: Promise<PrismaClient>;
};

export function isRemoteDatabase() {
  return Boolean(process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL);
}

export function isNetlifyHost() {
  return Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export function getSqliteFilePath() {
  if (isNetlifyHost() && !isRemoteDatabase()) {
    return "/tmp/duneworks.db";
  }
  const raw = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const relative = raw.replace(/^file:/, "");
  if (path.isAbsolute(relative)) return relative;
  return path.join(/* turbopackIgnore: true */ process.cwd(), "prisma", "dev.db");
}

export function getDatabaseUrl() {
  return (
    process.env.TURSO_DATABASE_URL ||
    process.env.LIBSQL_URL ||
    `file:${getSqliteFilePath()}`
  );
}

function migrationsDirectory() {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "prisma", "migrations");
}

async function ensureLocalSchema(filePath: string) {
  const bundled = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "prisma",
    "dev.db"
  );
  if (!existsSync(filePath) && existsSync(bundled) && bundled !== filePath) {
    copyFileSync(bundled, filePath);
  }

  const client = createClient({ url: `file:${filePath}` });
  try {
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    const names = new Set(tables.rows.map((row) => String(row.name)));
    const root = migrationsDirectory();
    if (!existsSync(root)) return;

    const folders = readdirSync(root)
      .filter((name) => existsSync(path.join(root, name, "migration.sql")))
      .sort();

    if (!names.has("User")) {
      for (const folder of folders) {
        const sql = readFileSync(path.join(root, folder, "migration.sql"), "utf8");
        await client.executeMultiple(sql);
      }
      return;
    }

    if (!names.has("PipelineStage")) {
      const folder = folders.find((name) => name.includes("pipeline"));
      if (folder) {
        const sql = readFileSync(path.join(root, folder, "migration.sql"), "utf8");
        await client.executeMultiple(sql);
      }
    }
  } finally {
    client.close();
  }
}

async function createPrismaClient() {
  if (!isRemoteDatabase()) {
    await ensureLocalSchema(getSqliteFilePath());
  }

  const adapter = new PrismaLibSql({
    url: getDatabaseUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN,
  });
  const client = new PrismaClient({ adapter });
  const { ensureStudioSeed } = await import("@/lib/seed");
  await ensureStudioSeed(client);
  return client;
}

export function getPrisma() {
  if (globalForPrisma.prisma) {
    return Promise.resolve(globalForPrisma.prisma);
  }
  if (!globalForPrisma.prismaReady) {
    globalForPrisma.prismaReady = createPrismaClient().then((client) => {
      globalForPrisma.prisma = client;
      return client;
    });
  }
  return globalForPrisma.prismaReady;
}
