import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import config from "../playwright.config";

describe("e2e web server env", () => {
  it("sets every variable .env.example names, so .env.local never leaks in (audit tests:16)", () => {
    const names =
      readFileSync(".env.example", "utf8").match(/^[A-Z][A-Z0-9_]*(?==)/gm) ??
      [];
    const { env } = config.webServer as { env: Record<string, string> };
    expect(names.filter((n) => !(n in env))).toEqual([]);
  });
});
