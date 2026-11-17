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

/** A client or a transaction: anything that runs raw SQL. */
type Sql = Pick<PrismaClient, "$executeRawUnsafe">;

export function createTestDb(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: testDatabaseUrl() }),
  });
}

export async function resetDb(db: Sql): Promise<void> {
  await db.$executeRawUnsafe(`
    DO $$ DECLARE t text;
    BEGIN
      SELECT string_agg(format('%I', tablename), ', ') INTO t
      FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations';
      EXECUTE 'TRUNCATE ' || t || ' CASCADE';
    END $$;`);
}

/**
 * Copy the seeded tables into a seed_snapshot schema, once per run
 * (global-setup), so each test restores them instead of seeding again
 * (audit tests:10). resetDb only truncates public, so the copy stays.
 */
export async function saveSeedSnapshot(db: Sql): Promise<void> {
  await db.$executeRawUnsafe(`
    DO $$ DECLARE t text;
    BEGIN
      DROP SCHEMA IF EXISTS seed_snapshot CASCADE;
      CREATE SCHEMA seed_snapshot;
      FOR t IN SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
      LOOP
        EXECUTE format('CREATE TABLE seed_snapshot.%I AS TABLE public.%I', t, t);
      END LOOP;
    END $$;`);
}

/**
 * Empty the database and restore the seed from the snapshot, the fast
 * resetDb plus seedDatabase. `people: false` leaves out the users, as
 * seedDatabase does.
 */
export async function resetToSeed(
  db: PrismaClient,
  { people = true } = {}
): Promise<void> {
  // ponytail: replica mode skips foreign keys and needs a superuser (postgres
  // in Docker and CI); insert in FK order if that changes.
  // ponytail: watch mode takes the snapshot once, so restart after editing
  // prisma/seed-data.ts.
  await db.$executeRawUnsafe(`
    DO $$ DECLARE t text;
    BEGIN
      SELECT string_agg(format('%I', tablename), ', ') INTO t
      FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations';
      EXECUTE 'TRUNCATE ' || t || ' CASCADE';
      PERFORM set_config('session_replication_role', 'replica', true);
      FOR t IN SELECT tablename FROM pg_tables
        WHERE schemaname = 'seed_snapshot'${people ? "" : " AND tablename <> 'users'"}
      LOOP
        EXECUTE format('INSERT INTO public.%I SELECT * FROM seed_snapshot.%I', t, t);
      END LOOP;
      PERFORM set_config('session_replication_role', 'origin', true);
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
