import { describe, expect, it } from "vitest";

import { auth } from "./auth";

const post = (path: string) =>
  auth.handler(
    new Request(`${process.env.BETTER_AUTH_URL}/api/auth${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: process.env.BETTER_AUTH_URL!,
      },
      body: JSON.stringify({ name: "x".repeat(500) }),
    })
  );

describe("Better Auth routes this site never uses (audit ID2-04)", () => {
  it("are closed over HTTP", async () => {
    for (const path of ["/update-user", "/delete-user", "/sign-up/email"]) {
      expect((await post(path)).status, path).toBe(404);
    }
  });
});
