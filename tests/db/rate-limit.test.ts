import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { pruneRateLimits } from "@/lib/rate-limit";

import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();

beforeEach(() => resetDb(db));
afterAll(() => db.$disconnect());

// Sign-in keys hold emails and IPs, so a window past is forgotten each
// morning.
describe("pruneRateLimits", () => {
  it("forgets rows older than a day and keeps the rest", async () => {
    const at = new Date("2026-11-03T22:00:00Z");
    await db.rateLimit.createMany({
      data: [
        {
          key: "link:old@example.com",
          windowStart: new Date("2026-11-02T21:00:00Z"),
          count: 1,
        },
        {
          key: "link:new@example.com",
          windowStart: new Date("2026-11-03T21:00:00Z"),
          count: 1,
        },
      ],
    });
    expect(await pruneRateLimits(at)).toBe(1);
    expect((await db.rateLimit.findMany()).map((r) => r.key)).toEqual([
      "link:new@example.com",
    ]);
  });
});
