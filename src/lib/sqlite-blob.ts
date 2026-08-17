import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { getStore } from "@netlify/blobs";

const STORE = "duneworks-crm";
const KEY = "studio-sqlite";

export function usesDurableSqliteStore() {
  const remote = Boolean(process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL);
  const netlify = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
  return netlify && !remote;
}

function openStore() {
  return getStore({ name: STORE, consistency: "strong" });
}

export async function readSqliteSnapshot(cachedEtag?: string): Promise<{
  etag?: string;
  unchanged: boolean;
  bytes?: Buffer;
}> {
  if (!usesDurableSqliteStore()) {
    return { unchanged: true, etag: cachedEtag };
  }

  try {
    const store = openStore();
    const result = await store.getWithMetadata(KEY, {
      type: "arrayBuffer",
      consistency: "strong",
      ...(cachedEtag ? { etag: cachedEtag } : {}),
    });
    if (!result) return { unchanged: false };

    if (cachedEtag && result.etag === cachedEtag && result.data == null) {
      return { unchanged: true, etag: cachedEtag };
    }

    const data = result.data;
    if (!data) return { unchanged: Boolean(cachedEtag), etag: result.etag };

    return {
      unchanged: false,
      etag: result.etag,
      bytes: Buffer.from(data),
    };
  } catch {
    return { unchanged: Boolean(cachedEtag), etag: cachedEtag };
  }
}

export function applySqliteSnapshot(filePath: string, bytes: Buffer) {
  writeFileSync(filePath, bytes);
}

async function checkpoint(filePath: string) {
  if (!existsSync(filePath)) return;
  const client = createClient({ url: `file:${filePath}` });
  try {
    await client.execute("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch {
    /* the file may not be in WAL mode */
  } finally {
    client.close();
  }
}

export async function persistSqliteFile(filePath: string): Promise<string | undefined> {
  if (!usesDurableSqliteStore() || !existsSync(filePath)) return;

  await checkpoint(filePath);
  const store = openStore();
  const file = readFileSync(filePath);
  const body = Uint8Array.from(file).buffer;
  const written = await store.set(KEY, body, {
    metadata: { updatedAt: new Date().toISOString() },
  });
  return written?.etag;
}
