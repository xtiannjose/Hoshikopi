import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { revalidateTag } from "next/cache";

import { GET as cron } from "@/app/api/cron/daily/route";
import { freezeClock, unfreezeClock } from "@/lib/clock";
import { POST as webhook } from "@/app/api/webhooks/[provider]/route";

import { createTestDb, resetToSeed } from "./helpers";

// A route handler outside Next has no request store and no cache.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  connection: async () => {},
}));
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  revalidateTag: vi.fn(),
}));

const db = createTestDb();

const SECRET = "cron-secret-for-tests";

beforeEach(async () => {
  await resetToSeed(db);
  vi.stubEnv("CRON_SECRET", SECRET);
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => db.$disconnect());

const fake = { params: Promise.resolve({ provider: "fake" }) };

// The webhook read any body, up to Vercel's 4.5 MB (audit SEC2-09, SEC1-10).
describe("POST /api/webhooks/[provider]", () => {
  it("refuses a body over 64 kB before reading it as an event", async () => {
    const big = "x".repeat(64 * 1024 + 1);
    const response = await webhook(
      new Request("http://localhost/api/webhooks/fake", {
        method: "POST",
        body: big,
      }),
      fake
    );
    expect(response.status).toBe(413);
  });

  it("still answers an ordinary body (an unsigned one is refused as before)", async () => {
    const response = await webhook(
      new Request("http://localhost/api/webhooks/fake", {
        method: "POST",
        body: "{}",
      }),
      fake
    );
    expect(response.status).not.toBe(413);
  });
});

// The secret was compared with !==, which can leak through timing (audit
// SEC2-13, SEC1-21).
describe("GET /api/cron/daily", () => {
  const call = (authorization?: string) =>
    cron(
      new Request("http://localhost/api/cron/daily", {
        headers: authorization ? { authorization } : {},
      })
    );

  it("refuses a missing, wrong or near-miss secret", async () => {
    for (const header of [
      undefined,
      "Bearer wrong",
      `Bearer ${SECRET}x`,
      `Bearer ${SECRET.slice(0, -1)}`,
      SECRET,
    ]) {
      expect((await call(header)).status, String(header)).toBe(401);
    }
  });

  it("runs with the right secret", async () => {
    const response = await call(`Bearer ${SECRET}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ expired: 0, cancelled: 0 });
    // At once, not stale-while-revalidate (audit PERF-21).
    expect(revalidateTag).toHaveBeenCalledWith("menu", { expire: 0 });
  });
});

// Only the secret and two numbers were checked, so dropping a clean-up step
// or the Demo Mode gate passed every test; without the gate, a PayMongo
// deploy would re-date the seeded Events and delete their Sign-ups (audit
// DC-45).
describe("what the daily job does", () => {
  const NOW = new Date("2026-11-17T22:00:00Z");
  const run = () =>
    cron(
      new Request("http://localhost/api/cron/daily", {
        headers: { authorization: `Bearer ${SECRET}` },
      })
    );

  beforeEach(async () => {
    freezeClock(NOW);
    const longAgo = new Date(NOW.getTime() - 40 * 86_400_000);
    await db.rateLimit.create({
      data: { key: "link:old@example.com", windowStart: longAgo, count: 1 },
    });
    await db.cart.create({
      data: { guestTokenHash: "old-guest", updatedAt: longAgo },
    });
    // A seeded demo Event that ended a week ago.
    await db.event.update({
      where: { slug: "latte-art-night" },
      data: {
        startsAt: new Date(NOW.getTime() - 7 * 86_400_000),
        endsAt: new Date(NOW.getTime() - 7 * 86_400_000 + 7_200_000),
      },
    });
  });
  afterEach(unfreezeClock);

  const ends = async () =>
    (await db.event.findUniqueOrThrow({ where: { slug: "latte-art-night" } }))
      .endsAt;

  it("prunes old limits and Guest Carts, and rolls the demo Events forward", async () => {
    expect((await run()).status).toBe(200);
    expect(
      await db.rateLimit.count({ where: { key: "link:old@example.com" } })
    ).toBe(0);
    expect(
      await db.cart.count({ where: { guestTokenHash: "old-guest" } })
    ).toBe(0);
    expect((await ends()).getTime()).toBeGreaterThan(NOW.getTime());
    expect(revalidateTag).toHaveBeenCalledWith("events", { expire: 0 });
  });

  it("leaves the Events alone when Demo Mode is off", async () => {
    vi.stubEnv("PAYMENT_PROVIDER", "paymongo");
    const before = await ends();
    expect((await run()).status).toBe(200);
    expect(await ends()).toEqual(before);
  });
});
