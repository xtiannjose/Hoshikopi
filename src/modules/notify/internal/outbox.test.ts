import { readdir } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { canEmail, isDemoAccount, send } from "./outbox";

describe("canEmail (audit journeys:9)", () => {
  const env = (values: Record<string, string>) =>
    values as unknown as NodeJS.ProcessEnv;

  it("is off on Vercel without a Resend key: the live demo today", () => {
    expect(canEmail(env({ VERCEL: "1" }))).toBe(false);
  });

  it("is on with a Resend key, and off Vercel (the local outbox)", () => {
    expect(canEmail(env({ VERCEL: "1", RESEND_API_KEY: "re_x" }))).toBe(true);
    expect(canEmail(env({}))).toBe(true);
  });

  it("knows the seeded demo accounts' reserved domain", () => {
    expect(isDemoAccount("christian@hoshikopi.example")).toBe(true);
    expect(isDemoAccount("hoshi@example.com")).toBe(false);
  });
});

const email = {
  to: "hoshi@example.com",
  subject: "Your Hoshikopi sign-in link",
  text: "Sign in: https://hoshikopi.vercel.app/api/auth/magic-link/verify?token=secret-token",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("send without RESEND_API_KEY (ADR 0005)", () => {
  it("keeps the email body, and so any sign-in link, out of hosting logs", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("VERCEL", "1");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await send(email);

    const printed = [...log.mock.calls, ...error.mock.calls].flat().join(" ");
    expect(printed).toContain(email.subject);
    expect(printed).not.toContain("secret-token");
  });

  it("logs the link for a seeded demo account, even with a Resend key", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("VERCEL", "1");
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await send({ ...email, to: "christian@hoshikopi.example" });

    expect(fetch).not.toHaveBeenCalled();
    expect(log.mock.calls.flat().join(" ")).toContain("secret-token");
  });
});

describe("send to the local outbox (no key)", () => {
  // An Event Sign-up email only needs an @ and a dot, so it can hold "../"
  // (audit, 7.3): the file must still land inside the outbox folder.
  it("keeps the file inside the outbox whatever the address holds", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("VERCEL", "");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const marker = `escaped-${Date.now()}`;
    // data/mail-test, set for every Vitest run in vitest.config.mts.
    const mail = process.env.MAIL_DIR!;

    await send({ ...email, to: `a/../../../${marker}@example.com` });

    const parent = await readdir(path.dirname(mail));
    expect(parent.some((f) => f.includes(marker))).toBe(false);
    const inMail = await readdir(mail);
    expect(inMail.some((f) => f.includes(marker))).toBe(true);
  });
});
