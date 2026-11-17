import { describe, expect, it } from "vitest";

import config from "../next.config";

// The live site sent no Cross-Origin-Opener-Policy, and `next start` named
// the framework in X-Powered-By (audit ops:20, SEC1-15, SEC2-12).
describe("next.config.ts security headers", () => {
  it("isolates the page from windows it opens, and does not name the framework", async () => {
    expect(config.poweredByHeader).toBe(false);
    const [rule] = (await config.headers?.()) ?? [];
    expect(rule.source).toBe("/:path*");
    expect(rule.headers).toContainEqual({
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    });
  });
});
