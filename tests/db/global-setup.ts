import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

import { config } from "dotenv";

import { testDatabaseUrl } from "./helpers";

// Bring the test database up to the latest migration once per run, and
// start with an empty test outbox (MAIL_DIR in vitest.config.mts).
export default function setup() {
  rmSync(path.join(process.cwd(), "data", "mail-test"), {
    recursive: true,
    force: true,
  });
  config({ path: ".env.test", override: true, quiet: true });
  const url = testDatabaseUrl();
  try {
    execSync("npx prisma migrate deploy", {
      stdio: "pipe",
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? "";
    throw new Error(
      `Could not migrate the test database. Is Docker running ` +
        `("docker start hoshikopi-db")?\n${stderr.trim()}`
    );
  }
}
