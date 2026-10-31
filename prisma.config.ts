import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local; Prisma does not, so load it here. Variables
// already set (Vitest global setup, Playwright) win over the file.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations use the direct connection. Optional so that `prisma generate`
  // works without a database. On Vercel, Neon's integration names it
  // DATABASE_URL_UNPOOLED.
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED ?? "",
  },
});
