import { defineConfig, devices } from "@playwright/test";

import { E2E_MAIL_DIR } from "./tests/e2e/mail";
import { NO_OUTSIDE_SERVICES } from "./tests/no-outside-services.mts";

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
  // Parallel workers place Orders into the same Pickup Window, and
  // placement waits its turn on that window's lock, so allow 10 s.
  expect: { timeout: 10_000 },
  // A forgotten test.only would shrink a local run to one test and still
  // pass; Playwright never runs in CI to catch it (audit DC-43).
  forbidOnly: true,
  // One retry on this computer: a test that passes the second time is
  // reported as flaky, not hidden, and a single flake no longer stops every
  // @cafe-wide test, which waits for phone and desktop (audit DC-44).
  retries: process.env.CI ? 2 : 1,
  globalSetup: "./tests/e2e/time-guard.ts",
  use: {
    baseURL: BASE_URL,
    // Keep the evidence of a failure even without retries.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Motion off (docs/05 section 7): axe checks the settled page, never a
    // card halfway through a fade.
    reducedMotion: "reduce",
  },
  // Tests tagged @cafe-wide change what every other test sees (pause,
  // Special Hours, Busy Mode, a price, Sold Out), so they run in their own
  // project after the other two, one at a time.
  projects: [
    {
      name: "phone",
      grepInvert: /@cafe-wide/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "desktop",
      grepInvert: /@cafe-wide/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "cafe-wide",
      grep: /@cafe-wide/,
      dependencies: ["phone", "desktop"],
      workers: 1,
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
      // Playwright types in an instant; botCheck's own tests cover it.
      FORM_MIN_FILL_MS: "0",
      // One IP signs in 60+ times with no minute's pause (identity auth.ts).
      AUTH_RATE_LIMIT: "off",
      // Every test adds to a Cart from this one address (src/lib/limits.ts).
      CART_RATE_LIMIT: "off",
      BETTER_AUTH_SECRET: "e2e-secret-at-least-32-characters-long",
      PAYMENT_PROVIDER: "fake",
      CRON_SECRET: "e2e-cron-secret",
      // Its own outbox, emptied by reset-db.mts, so the developer's
      // data/mail is untouched and tests only find this run's emails.
      MAIL_DIR: E2E_MAIL_DIR,
      // Empty, never the developer's .env.local (audit tests:16).
      ...NO_OUTSIDE_SERVICES,
      // A production build that still writes its emails for the tests to
      // read (audit DATA-10).
      MAIL_OUTBOX: "1",
    },
  },
});
