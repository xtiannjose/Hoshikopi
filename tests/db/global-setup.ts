import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

import { config } from "dotenv";

import { seedDatabase } from "../../prisma/seed-data";
import {
  createTestDb,
  resetDb,
  saveSeedSnapshot,
  testDatabaseUrl,
} from "./helpers";

// Bring the test database up to the latest migration once per run, and
// start with an empty test outbox (MAIL_DIR in vitest.config.mts).
export default async function setup() {
  rmSync(path.join(process.cwd(), "data", "mail-test"), {
    recursive: true,
    force: true,
  });
  config({ path: ".env.test", override: true, quiet: true });
  const url = testDatabaseUrl();
  const db = createTestDb();
  try {
    // The old copy's columns use the public enum types, so a migration that
    // drops or replaces an enum fails while it exists (audit tests:10).
    await db.$executeRawUnsafe("DROP SCHEMA IF EXISTS seed_snapshot CASCADE");
    execSync("npx prisma migrate deploy", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    });
  } catch (error) {
    await db.$disconnect();
    const stderr =
      (error as { stderr?: Buffer }).stderr?.toString() ?? String(error);
    throw new Error(
      `Could not migrate the test database. Is Docker running ` +
        `("docker start hoshikopi-db")?\n${stderr.trim()}`
    );
  }
  // Seed once per run; each test restores the copy (audit tests:10). One
  // transaction, so two runs started at once take turns.
  await db.$transaction(
    async (tx) => {
      await resetDb(tx);
      await seedDatabase(tx);
      await saveSeedSnapshot(tx);
    },
    { timeout: 120_000 }
  );
  await db.$disconnect();
}
