import { describe, expect, it } from "vitest";

import { auth } from "./auth";

const call = (path: string, method = "POST") =>
  auth.handler(
    new Request(`${process.env.BETTER_AUTH_URL}/api/auth${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        origin: process.env.BETTER_AUTH_URL!,
      },
      body: method === "POST" ? JSON.stringify({}) : undefined,
    })
  );

describe("Better Auth routes this site never uses (audit ID2-04)", () => {
  it("are closed over HTTP, every one of them", async () => {
    const closed = auth.options.disabledPaths ?? [];
    expect(closed).toContain("/update-user");
    for (const path of closed) {
      expect((await call(path)).status, path).toBe(404);
    }
  });

  it("leave open what sign-in needs", async () => {
    expect((await call("/get-session", "GET")).status).not.toBe(404);
  });
});
