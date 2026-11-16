import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type Prisma } from "@/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  // A busy pool or a stale socket after a suspended instance fails within
  // 5 s instead of queueing with no limit (audit ops:13).
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 5_000,
    }),
  });
}

// Reuse one client across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: PrismaClient };

export const db = globalForDb.db ?? createClient();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

/** The shared client, or a transaction a caller already opened. */
export type Client = typeof db | Prisma.TransactionClient;

/** Runs `work` in the caller's transaction, or in a new one when given `db`. */
export function inTransaction<T>(
  client: Client,
  work: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return client === db ? db.$transaction(work) : work(client);
}
