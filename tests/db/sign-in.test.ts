import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { authHandler, emailSignInLink } from "@/modules/identity";

import { createTestDb, mailTo, resetDb } from "./helpers";

// emailSignInLink reads the request's headers, and a test has no request.
vi.mock("next/headers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/headers")>()),
  headers: async () => new Headers(),
}));

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

// A database read or a backup must not be enough to sign in as someone,
// Staff included (audit SEC1-13).
describe("Sign-in links", () => {
  it("keep only a hash of the token, and the emailed link still signs in", async () => {
    const email = `link-${Date.now()}@example.com`;
    await emailSignInLink(email, "/account");
    const [mail] = await mailTo(email);
    const link = mail.match(/https?:\/\/\S+/)![0];
    const token = new URL(link).searchParams.get("token")!;

    const rows = await db.verification.findMany();
    expect(rows).toHaveLength(1);
    const [row] = rows;
    expect(row.identifier).toMatch(/^magic-link:/);
    expect(row.identifier).not.toContain(token);
    // What a database read shows does not sign in.
    const leaked = new URL(link);
    leaked.searchParams.set(
      "token",
      row.identifier.slice("magic-link:".length)
    );
    const stolen = await authHandler.GET(new Request(leaked));
    expect(stolen.headers.get("location")).toContain("error=INVALID_TOKEN");
    expect(await db.session.count()).toBe(0);

    // The emailed link still works.
    const res = await authHandler.GET(new Request(link));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).not.toContain("error=");
    expect(await db.session.count({ where: { user: { email } } })).toBe(1);
  });
});
