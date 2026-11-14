// Truncates and re-seeds the end-to-end database and empties its outbox.
// Run by the Playwright webServer command before the app builds and starts.
import { rm } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../src/generated/prisma/client";
import { seedDatabase } from "../../prisma/seed-data";
import { resetDb } from "../db/helpers";

const url = process.env.DATABASE_URL ?? "";
if (!/_e2e(\?|$)/.test(url))
  throw new Error("Refusing to reset a database that is not *_e2e");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});
try {
  await resetDb(db);
  await seedDatabase(db);
} finally {
  await db.$disconnect();
}

// The e2e outbox only (MAIL_DIR in playwright.config.ts), never data/mail.
const mail = process.env.MAIL_DIR ?? "";
if (path.basename(mail) === "mail-e2e") {
  await rm(mail, { recursive: true, force: true });
}
