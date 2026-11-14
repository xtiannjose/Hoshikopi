import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.ts"],
    // .env.test points tests at the hoshikopi_test database. Emails go to
    // their own outbox, emptied by global-setup, not the developer's
    // data/mail.
    env: {
      ...loadEnv("test", process.cwd(), ""),
      MAIL_DIR: path.join(process.cwd(), "data", "mail-test"),
    },
    globalSetup: ["tests/db/global-setup.ts"],
    // Database tests share one database, so run files one at a time.
    fileParallelism: false,
  },
});
