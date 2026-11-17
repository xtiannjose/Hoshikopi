/**
 * Outside services stay off in Vitest and Playwright, whatever .env.local
 * holds: emails go to the test outbox, no Google sign-in, photos stay local,
 * and a `vercel env pull` cannot switch any of that back on (audit tests:16,
 * DC-04). A new outside service in .env.example belongs here too;
 * tests/e2e-server.test.ts checks.
 */
export const NO_OUTSIDE_SERVICES = {
  RESEND_API_KEY: "",
  MAIL_FROM: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  BLOB_STORE_ID: "",
  BLOB_READ_WRITE_TOKEN: "",
  PAYMONGO_SECRET_KEY: "",
  PAYMONGO_WEBHOOK_SECRET: "",
  VERCEL: "",
  VERCEL_ENV: "",
  VERCEL_URL: "",
};
