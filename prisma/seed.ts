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
  await seedDatabase(db);
  console.log("Seed complete.");
}

main().finally(() => db.$disconnect());
