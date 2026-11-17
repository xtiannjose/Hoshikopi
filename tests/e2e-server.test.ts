import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import config from "../playwright.config";
import vitestConfig from "../vitest.config.mjs";
import { NO_OUTSIDE_SERVICES } from "./no-outside-services";

/** The settings tests need; everything else in .env.example is an outside service. */
const CORE = [
  "DATABASE_URL",
  "DIRECT_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_SITE_URL",
  "CRON_SECRET",
  "PAYMENT_PROVIDER",
];
const exampleNames = () =>
  readFileSync(".env.example", "utf8").match(/^[A-Z][A-Z0-9_]*(?==)/gm) ?? [];

describe("e2e web server env", () => {
  it("sets every variable .env.example names, so .env.local never leaks in (audit tests:16)", () => {
    const { env } = config.webServer as { env: Record<string, string> };
    expect(exampleNames().filter((n) => !(n in env))).toEqual([]);
  });
});

// Vitest read .env.local too, so a real RESEND_API_KEY there made the
// database tests send real email (audit DC-04).
describe("Vitest env", () => {
  it("switches every outside service off, whatever .env.local holds (audit DC-04)", () => {
    const env = (vitestConfig as { test: { env: Record<string, string> } }).test
      .env;
    expect(env).toMatchObject(NO_OUTSIDE_SERVICES);
  });

  it("knows every outside service .env.example names", () => {
    expect(
      exampleNames().filter(
        (n) => !CORE.includes(n) && !(n in NO_OUTSIDE_SERVICES)
      )
    ).toEqual([]);
  });
});
