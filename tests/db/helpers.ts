import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Tests wipe tables, so refuse anything that is not a *_test database.
export function testDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url || !/\/[\w-]*_test(\?|$)/.test(url)) {
    throw new Error(
      `Refusing to run database tests against ${url ?? "(unset)"}; set DATABASE_URL in .env.test to a *_test database.`
    );
  }
  return url;
}

export function createTestDb(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: testDatabaseUrl() }),
  });
}

export async function resetDb(db: PrismaClient): Promise<void> {
  await db.$executeRawUnsafe(`
    DO $$ DECLARE t text;
    BEGIN
      SELECT string_agg(format('%I', tablename), ', ') INTO t
      FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations';
      EXECUTE 'TRUNCATE ' || t || ' CASCADE';
    END $$;`);
}

/** Emails written to the test outbox for an address (no RESEND_API_KEY). */
export async function mailTo(address: string): Promise<string[]> {
  const dir = process.env.MAIL_DIR!;
  const files = (await readdir(dir).catch(() => [])).filter((f) =>
    f.endsWith(`-${address}.txt`)
  );
  return Promise.all(files.map((f) => readFile(path.join(dir, f), "utf8")));
}
