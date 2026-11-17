import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";
import { refuseRemoteDatabase } from "./local-only";
import { seedDatabase } from "./seed-data";

config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
// Seeded Staff accounts sign in by email link; never create them on a
// remote database by mistake. Unlike migrations, seeding is never part of a
// Vercel build, so VERCEL is not a pass here.
refuseRemoteDatabase(connectionString, { ...process.env, VERCEL: "" });

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
