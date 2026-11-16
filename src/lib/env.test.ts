import { afterEach, describe, expect, it, vi } from "vitest";

import { authSecret, siteUrl } from "./env";

afterEach(() => vi.unstubAllEnvs());

// The site address was read in 7 files with a localhost fallback, so a
// deploy missing it sent localhost links in emails (audit architecture:21).
describe("siteUrl", () => {
  it("is the configured address", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hoshikopi.vercel.app");
    expect(siteUrl()).toBe("https://hoshikopi.vercel.app");
  });

  it("falls back to localhost only off Vercel, and refuses on Production", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(siteUrl()).toBe("http://localhost:3000");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "hoshikopi-abc123.vercel.app");
    expect(() => siteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  // Preview builds have no NEXT_PUBLIC_SITE_URL on the live project, and
  // the throw stopped them (PR #106's Vercel check).
  it("links a Preview to its own deployment address", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "hoshikopi-git-x.vercel.app");
    expect(siteUrl()).toBe("https://hoshikopi-git-x.vercel.app");
  });
});

// The secret was read in 4 files, one falling back to an empty string.
describe("authSecret", () => {
  it("throws when unset rather than sign with nothing", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    expect(() => authSecret()).toThrow(/BETTER_AUTH_SECRET/);
    vi.stubEnv("BETTER_AUTH_SECRET", "a-secret-of-at-least-32-characters");
    expect(authSecret()).toBe("a-secret-of-at-least-32-characters");
  });
});
