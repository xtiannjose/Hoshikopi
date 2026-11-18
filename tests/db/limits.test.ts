import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { limits, PAY_AT_PICKUP_A_DAY } from "@/lib/limits";
import { takeToken } from "@/lib/rate-limit";

import { createTestDb } from "./helpers";

const db = createTestDb();

beforeEach(async () => {
  await db.rateLimit.deleteMany();
  freezeClock("2026-11-02T01:00:00Z");
});
afterEach(() => {
  unfreezeClock();
  vi.unstubAllEnvs();
});
afterAll(() => db.$disconnect());

/** How many of `tries` calls went ahead. */
async function allowed(tries: number, call: () => Promise<boolean>) {
  let yes = 0;
  for (let i = 0; i < tries; i++) if (await call()) yes++;
  return yes;
}

// Every limit was tested only in the browser tests, which CI does not run,
// so deleting one passed CI (audit DC-11).
describe("takeToken", () => {
  it("lets the limit through, refuses the next, and starts again next window", async () => {
    expect(await allowed(4, () => takeToken("t", 3, 60))).toBe(3);
    freezeClock("2026-11-02T01:00:59Z");
    expect(await takeToken("t", 3, 60)).toBe(false);
    freezeClock("2026-11-02T01:01:00Z");
    expect(await takeToken("t", 3, 60)).toBe(true);
  });

  it("counts each key on its own", async () => {
    expect(await allowed(2, () => takeToken("a", 1, 60))).toBe(1);
    expect(await takeToken("b", 1, 60)).toBe(true);
  });
});

describe("limits (docs/03 section 13)", () => {
  it("sign-in links: 3 to an address from one connection", async () => {
    expect(
      await allowed(4, () => limits.signInLink("hoshi@example.com", "1.1.1.1"))
    ).toBe(3);
  });

  // Two connections used up an address's 5 links, so the person could not
  // get one from their own (audit DC-09).
  it("sign-in links: a stranger on two connections leaves the person their own", async () => {
    const victim = "hoshi@example.com";
    await allowed(3, () => limits.signInLink(victim, "6.6.6.6"));
    await allowed(3, () => limits.signInLink(victim, "7.7.7.7"));
    expect(await limits.signInLink(victim, "1.1.1.1")).toBe(true);
  });

  it("sign-in links: 15 to an address from anywhere, 30 from one connection", async () => {
    let sent = 0;
    for (let ip = 1; ip <= 6; ip++) {
      sent += await allowed(3, () =>
        limits.signInLink("hoshi@example.com", `10.0.0.${ip}`)
      );
    }
    expect(sent).toBe(15);
    let fromOne = 0;
    for (let n = 1; n <= 11; n++) {
      fromOne += await allowed(3, () =>
        limits.signInLink(`guest${n}@example.com`, "2.2.2.2")
      );
    }
    expect(fromOne).toBe(30);
  });

  it("Google sign-in: 30 starts from one connection", async () => {
    expect(await allowed(31, () => limits.googleSignIn("1.1.1.1"))).toBe(30);
  });

  it("checkout: 10 tries a Cart and 20 a connection", async () => {
    expect(await allowed(11, () => limits.checkout("cart-a", "1.1.1.1"))).toBe(
      10
    );
    expect(await allowed(11, () => limits.checkout("cart-b", "1.1.1.1"))).toBe(
      10
    );
    expect(await limits.checkout("cart-c", "1.1.1.1")).toBe(false);
  });

  // A Member had no daily limit, so one free account could fill a day's
  // Pickup Windows with Orders nobody collects (audit DC-08).
  it("Pay at Pickup: 10 a day a Guest connection, 5 a day a Member", async () => {
    expect(await allowed(11, () => limits.payAtPickup(null, "1.1.1.1"))).toBe(
      PAY_AT_PICKUP_A_DAY.guestIp
    );
    expect(
      await allowed(6, () => limits.payAtPickup("seed-member", "1.1.1.1"))
    ).toBe(PAY_AT_PICKUP_A_DAY.member);
    // Another connection does not reset the Member's count.
    expect(await limits.payAtPickup("seed-member", "9.9.9.9")).toBe(false);
    expect(PAY_AT_PICKUP_A_DAY).toEqual({ guestIp: 10, member: 5 });
  });

  it("Inquiries: 5 an hour a connection", async () => {
    expect(await allowed(6, () => limits.inquiry("1.1.1.1"))).toBe(5);
    freezeClock("2026-11-02T02:00:00Z");
    expect(await limits.inquiry("1.1.1.1")).toBe(true);
  });

  it("Event Sign-ups: 10 an hour a connection", async () => {
    expect(await allowed(11, () => limits.eventSignup("1.1.1.1"))).toBe(10);
  });

  // Each add without a Cart cookie made a new guest Cart, so a script could
  // fill the free database (audit CK-01).
  it("Cart adds and changes: 60 every 15 minutes a connection", async () => {
    expect(await allowed(61, () => limits.addToCart("1.1.1.1"))).toBe(60);
    expect(await limits.addToCart("2.2.2.2")).toBe(true);
    freezeClock("2026-11-02T01:15:00Z");
    expect(await limits.addToCart("1.1.1.1")).toBe(true);
  });

  // The browser tests add from one address all run long, so their server
  // turns the limit off; on Vercel the switch does nothing.
  it("Cart adds: CART_RATE_LIMIT=off lifts the limit, except on Vercel", async () => {
    vi.stubEnv("CART_RATE_LIMIT", "off");
    expect(await allowed(61, () => limits.addToCart("3.3.3.3"))).toBe(61);
    vi.stubEnv("VERCEL", "1");
    expect(await allowed(61, () => limits.addToCart("4.4.4.4"))).toBe(60);
  });

  it("payment webhooks: 120 a minute a connection", async () => {
    expect(await allowed(121, () => limits.webhook("1.1.1.1"))).toBe(120);
  });
});
