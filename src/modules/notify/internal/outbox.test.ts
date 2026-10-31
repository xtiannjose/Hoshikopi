import { afterEach, describe, expect, it, vi } from "vitest";

import { send } from "./outbox";

const email = {
  to: "christian@example.com",
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
});
