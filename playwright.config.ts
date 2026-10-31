import { defineConfig, devices } from "@playwright/test";

// Browser tests build and serve the app on port 3100 against the
// hoshikopi_e2e database, migrated, reset and seeded first, at phone and
// desktop width.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const E2E_DATABASE_URL = (process.env.E2E_DATABASE_URL ??=
  "postgresql://postgres:dev@127.0.0.1:5434/hoshikopi_e2e");

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "phone",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: `npx prisma migrate deploy && npx tsx tests/e2e/reset-db.mts && npx next build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    // A production build takes a few minutes on a busy laptop.
    timeout: 600_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      DIRECT_URL: E2E_DATABASE_URL,
      BETTER_AUTH_URL: BASE_URL,
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      BETTER_AUTH_SECRET: "e2e-secret-at-least-32-characters-long",
      PAYMENT_PROVIDER: "fake",
      CRON_SECRET: "e2e-cron-secret",
    },
  },
});
