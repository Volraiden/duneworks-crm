import { copyFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import {
  applySqliteSnapshot,
  persistSqliteFile,
  readSqliteSnapshot,
  usesDurableSqliteStore,
} from "@/lib/sqlite-blob";

const WRITE_OPERATIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
  "delete",
  "deleteMany",
]);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaReady?: Promise<PrismaClient>;
  sqliteEtag?: string;
  durableLock?: Promise<PrismaClient>;
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

function withDurableWrites(client: PrismaClient, filePath: string) {
  if (!usesDurableSqliteStore()) return client;

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }) {
          const result = await query(args);
          if (WRITE_OPERATIONS.has(operation)) {
            try {
              const etag = await persistSqliteFile(filePath);
              if (etag) globalForPrisma.sqliteEtag = etag;
            } catch {
              /* user actions also call persistStudioDatabase() */
            }
          }
          return result;
        },
      },
    },
  }) as unknown as PrismaClient;
}

async function createPrismaClient() {
  const filePath = getSqliteFilePath();
  if (!isRemoteDatabase()) {
    await ensureLocalSchema(filePath);
  }

  const adapter = new PrismaLibSql({
    url: getDatabaseUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN,
  });
  const raw = new PrismaClient({ adapter });
  const { ensureStudioSeed } = await import("@/lib/seed");
  await ensureStudioSeed(raw);
  const client = withDurableWrites(raw, filePath);
  if (usesDurableSqliteStore()) {
    try {
      const etag = await persistSqliteFile(filePath);
      if (etag) globalForPrisma.sqliteEtag = etag;
    } catch {
      /* Blobs may be unavailable during build; runtime writes still persist. */
    }
  }
  return client;
}

async function getDurableSqliteClient() {
  const filePath = getSqliteFilePath();
  const snapshot = await readSqliteSnapshot(globalForPrisma.sqliteEtag);

  if (globalForPrisma.prisma && snapshot.unchanged) {
    return globalForPrisma.prisma;
  }

  if (snapshot.bytes) {
    applySqliteSnapshot(filePath, snapshot.bytes);
  }
  if (snapshot.etag) globalForPrisma.sqliteEtag = snapshot.etag;

  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }

  const client = await createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export async function persistStudioDatabase() {
  if (!usesDurableSqliteStore()) return;
  const etag = await persistSqliteFile(getSqliteFilePath());
  if (etag) globalForPrisma.sqliteEtag = etag;
}

export function getPrisma() {
  if (usesDurableSqliteStore()) {
    if (!globalForPrisma.durableLock) {
      globalForPrisma.durableLock = getDurableSqliteClient().finally(() => {
        globalForPrisma.durableLock = undefined;
      });
    }
    return globalForPrisma.durableLock;
  }

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
