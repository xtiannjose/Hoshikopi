import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";
import { seedDatabase } from "./seed-data";

config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
// Seeded Staff accounts sign in by email link; never create them on a
// remote database by mistake.
if (
  !/@(localhost|127\.0\.0\.1)[:/]/.test(connectionString) &&
  process.env.ALLOW_REMOTE_SEED !== "1"
) {
  throw new Error(
    "Refusing to seed a remote database. Set ALLOW_REMOTE_SEED=1 for a dev branch."
  );
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  if (await db.category.count()) {
    console.log("Already seeded; run `npm run db:reset` to start over.");
    return;
  }
  // All or nothing: a run that failed part way used to leave the menu
  // without cafe_settings or the people, and a rerun said "Already seeded"
  // (audit DATA-12).
  await db.$transaction((tx) => seedDatabase(tx), { timeout: 60_000 });
  console.log("Seed complete.");
}

main().finally(() => db.$disconnect());
