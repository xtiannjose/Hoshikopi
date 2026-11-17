import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// tests/db/limits.test.ts checks each limit's numbers; this checks each one
// is still called where a stranger's request arrives, so deleting the call
// fails a test (audit DC-11).
const WIRED: [file: string, call: string][] = [
  ["src/app/(site)/sign-in/actions.ts", "limits.signInLink("],
  ["src/app/(site)/sign-in/actions.ts", "limits.googleSignIn("],
  ["src/app/(site)/checkout/actions.ts", "limits.checkout("],
  ["src/app/(site)/checkout/actions.ts", "limits.payAtPickup("],
  ["src/app/(site)/cafe/inquire/actions.ts", "limits.inquiry("],
  ["src/app/(site)/events/[slug]/actions.ts", "limits.eventSignup("],
  ["src/app/api/webhooks/[provider]/route.ts", "limits.webhook("],
];

/** The only files that may call takeToken themselves. */
const OWN_LIMITS = [
  "src/lib/rate-limit.ts",
  "src/lib/limits.ts",
  // Per visitor per Event, and per Staff member: they need the module's data.
  "src/modules/content/internal/signups.ts",
  "src/modules/identity/internal/second-factor.ts",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      return name === "generated" ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

describe("limits are wired", () => {
  it.each(WIRED)("%s calls %s", (file, call) => {
    expect(readFileSync(file, "utf8")).toContain(call);
  });

  it("puts every other limit in src/lib/limits.ts", () => {
    const own = sourceFiles("src")
      .map((file) => file.split(path.sep).join("/"))
      .filter((file) => readFileSync(file, "utf8").includes("takeToken("));
    expect(own.sort()).toEqual([...OWN_LIMITS].sort());
  });
});
