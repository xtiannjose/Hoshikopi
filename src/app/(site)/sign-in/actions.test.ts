import { afterEach, describe, expect, it, vi } from "vitest";

import { takeToken } from "@/lib/rate-limit";
import { googleSignInUrl } from "@/modules/identity";

import { googleSignInAction } from "./actions";

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({
      "x-forwarded-for": "203.0.113.9",
      "x-real-ip": "203.0.113.9",
    }),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  takeToken: vi.fn(async () => true),
}));
vi.mock("@/modules/identity", () => ({
  googleSignInUrl: vi.fn(
    async () => "https://accounts.google.com/o/oauth2/auth?state=x"
  ),
  emailSignInLink: vi.fn(),
  safeNext: (next: string) => (next.startsWith("/") ? next : "/account"),
}));

const form = (next: string) => {
  const data = new FormData();
  data.set("next", next);
  return data;
};

afterEach(() => vi.clearAllMocks());

// Each start writes a verifications row for Google's state, so it is
// limited like the email link (audit ID2-10).
describe("googleSignInAction", () => {
  it("takes a token per IP, 30 per 15 minutes, then goes to Google", async () => {
    await expect(googleSignInAction(form("/checkout"))).rejects.toThrow(
      "NEXT_REDIRECT https://accounts.google.com/o/oauth2/auth?state=x"
    );
    expect(takeToken).toHaveBeenCalledWith("google-ip:203.0.113.9", 30, 900);
  });

  it("with no token left it starts nothing and says why on the sign-in page", async () => {
    vi.mocked(takeToken).mockResolvedValueOnce(false);
    await expect(googleSignInAction(form("/checkout"))).rejects.toThrow(
      "NEXT_REDIRECT /sign-in?next=%2Fcheckout&google=limited"
    );
    expect(googleSignInUrl).not.toHaveBeenCalled();
  });
});
