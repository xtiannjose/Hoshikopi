import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { PaymentMethod } from "@/generated/prisma/enums";
import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart, type CartOwner } from "@/modules/cart";
import { balance } from "@/modules/loyalty";
import {
  cancelByCustomer,
  cancelUncollected,
  expireUnpaid,
  placeOrder,
  transition,
} from "@/modules/ordering";
import { paymentProvider } from "@/modules/payments";

import { createTestDb, resetToSeed } from "./helpers";

const db = createTestDb();
const HOSHI = "seed-member";
const annika = { kind: "staff", id: "seed-barista", role: "barista" } as const;
const ids: Record<string, string> = {};
const items: Record<string, string> = {};

beforeEach(async () => {
  await resetToSeed(db);
  for (const o of await db.option.findMany()) ids[o.name] = o.id;
  for (const i of await db.menuItem.findMany()) items[i.slug] = i.id;
  freezeClock("2026-11-02T01:00:00Z");
});
afterEach(() => {
  unfreezeClock();
  vi.restoreAllMocks();
});
afterAll(() => db.$disconnect());

const giveStars = (stars: number) =>
  db.starEntry.create({
    data: { memberId: HOSHI, kind: "adjust", stars, reason: "test" },
  });

/** Hoshi's Cart: 2 Large Oat Hoshi Lattes (250 each) and an Ube Pandesal (75). */
async function fillCart(owner: CartOwner) {
  await addLine(owner, {
    menuItemId: items["hoshi-latte"],
    optionIds: [ids["Large"], ids["Oat milk"], ids["100%"], ids["Normal"]],
    quantity: 2,
    note: "",
  });
  await addLine(owner, {
    menuItemId: items["ube-pandesal"],
    optionIds: [],
    quantity: 1,
    note: "",
  });
}

async function order(
  useReward: boolean,
  paymentMethod: PaymentMethod = "pay_at_pickup",
  seen?: number
) {
  const owner = { memberId: HOSHI };
  await fillCart(owner);
  return placeOrder({
    owner,
    memberId: HOSHI,
    // The Reward takes the Hoshi Latte's 185 Base Price off 575.
    seenTotalCents:
      seen ?? (await getCart(owner)).totalCents - (useReward ? 18500 : 0),
    customerName: "Hoshi",
    customerEmail: "hoshi@example.com",
    customerPhone: "",
    pickup: { kind: "asap" },
    paymentMethod,
    useReward,
  });
}

describe("redeeming a Reward (LOY-03)", () => {
  it("makes one drink free except its Option Price Deltas and reserves 9 Stars", async () => {
    await giveStars(9);
    const result = await order(true);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const placed = await db.order.findUniqueOrThrow({
      where: { id: result.orderId },
      include: { lines: { orderBy: { unitCents: "desc" } } },
    });
    expect(placed).toMatchObject({ totalCents: 39000, rewardStars: 9 });
    expect(
      placed.lines.map((l) => [l.name, l.quantity, l.unitCents, l.isReward])
    ).toEqual([
      ["Hoshi Latte", 1, 25000, false],
      ["Ube Pandesal", 1, 7500, false],
      ["Hoshi Latte", 1, 6500, true],
    ]);
    expect(await balance(HOSHI)).toBe(0);
  });

  it("refuses without 9 Stars", async () => {
    await giveStars(8);
    expect(await order(true)).toEqual({
      ok: false,
      reason: "not_enough_stars",
    });
  });

  it("gives the Stars back when the Order is cancelled or expires", async () => {
    await giveStars(18);
    const first = await order(true);
    if (!first.ok) throw new Error(first.reason);
    await cancelByCustomer(first.orderId, first.accessToken);
    expect(await balance(HOSHI)).toBe(18);

    await order(true, "gcash");
    expect(await balance(HOSHI)).toBe(9);
    await expireUnpaid(new Date("2026-11-02T01:20:00Z"));
    expect(await balance(HOSHI)).toBe(18);
  });

  it("earns no Star for the free drink", async () => {
    await giveStars(9);
    const result = await order(true);
    if (!result.ok) throw new Error(result.reason);
    for (const to of ["accepted", "preparing", "ready", "picked_up"] as const) {
      await transition(result.orderId, to, annika);
    }
    // Two Hoshi Lattes, one of them the Reward: 1 Star.
    expect(await balance(HOSHI)).toBe(1);
  });

  // Nothing is left to pay online, so no checkout for PHP 0.00 (audit
  // journeys:11).
  it("places a fully free Order with no online Payment, whatever method was chosen", async () => {
    await giveStars(9);
    const owner = { memberId: HOSHI };
    await addLine(owner, {
      menuItemId: items["hoshi-latte"],
      optionIds: [
        ids["Regular"],
        ids["Whole milk"],
        ids["100%"],
        ids["Normal"],
      ],
      quantity: 1,
      note: "",
    });
    const result = await placeOrder({
      owner,
      memberId: HOSHI,
      seenTotalCents: 0,
      customerName: "Hoshi",
      customerEmail: "hoshi@example.com",
      customerPhone: "",
      pickup: { kind: "asap" },
      paymentMethod: "gcash",
      useReward: true,
    });
    expect(result).toMatchObject({
      ok: true,
      totalCents: 0,
      checkoutUrl: null,
    });
    if (!result.ok) return;
    const placed = await db.order.findUniqueOrThrow({
      where: { id: result.orderId },
      include: { payment: true },
    });
    expect(placed.paymentMethod).toBe("pay_at_pickup");
    expect(placed.payment).toBeNull();
  });

  // Untested refusals (audit tests:8).
  it("refuses a Reward with no drink in the Cart, or for a Guest", async () => {
    await giveStars(9);
    const base = {
      customerName: "Hoshi",
      customerEmail: "hoshi@example.com",
      customerPhone: "",
      pickup: { kind: "asap" as const },
      paymentMethod: "pay_at_pickup" as const,
      useReward: true,
    };
    const owner = { memberId: HOSHI };
    await addLine(owner, {
      menuItemId: items["ube-pandesal"],
      optionIds: [],
      quantity: 1,
      note: "",
    });
    expect(
      await placeOrder({
        ...base,
        owner,
        memberId: HOSHI,
        seenTotalCents: 7500,
      })
    ).toEqual({ ok: false, reason: "reward_unavailable" });
    const guest = { guestTokenHash: "guest-reward" };
    await fillCart(guest);
    expect(
      await placeOrder({
        ...base,
        owner: guest,
        memberId: null,
        seenTotalCents: 39000,
      })
    ).toEqual({ ok: false, reason: "reward_unavailable" });
    expect(await db.order.count()).toBe(0);
    expect(await balance(HOSHI)).toBe(9);
  });

  // A payment page that won't open gives the Stars back at once, and the
  // free drink goes back in the Cart on the Line it came from (audit
  // tests:8, ORD-05).
  it("gives the Stars and the Lines back when the payment page won't open", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(paymentProvider(), "createCheckout").mockRejectedValueOnce(
      new Error("provider down")
    );
    await giveStars(9);
    const owner = { memberId: HOSHI };
    await fillCart(owner);
    const before = await getCart(owner);
    expect(
      await placeOrder({
        owner,
        memberId: HOSHI,
        seenTotalCents: before.totalCents - 18500,
        customerName: "Hoshi",
        customerEmail: "hoshi@example.com",
        customerPhone: "",
        pickup: { kind: "asap" },
        paymentMethod: "gcash",
        useReward: true,
      })
    ).toEqual({ ok: false, reason: "payment_start_failed" });
    expect(await balance(HOSHI)).toBe(9);
    const after = await getCart(owner);
    expect(after.lines.map((l) => [l.menuItemId, l.quantity])).toEqual(
      before.lines.map((l) => [l.menuItemId, l.quantity])
    );
    expect(after.totalCents).toBe(before.totalCents);
  });

  // Nobody collected it: the morning cron gives the 9 Stars back (audit
  // ORD-13).
  it("gives the Stars back when nobody collects a Pay at Pickup Reward Order by the next morning", async () => {
    await giveStars(9);
    expect((await order(true)).ok).toBe(true);
    expect(await balance(HOSHI)).toBe(0);
    const morning = new Date("2026-11-02T22:00:00Z");
    freezeClock(morning);
    expect(await cancelUncollected(morning)).toBe(1);
    expect(await balance(HOSHI)).toBe(9);
  });

  it("lets only one of two tabs spend the same 9 Stars", async () => {
    await giveStars(9);
    const owner = { memberId: HOSHI };
    await fillCart(owner);
    const seen = (await getCart(owner)).totalCents - 18500;
    const base = {
      owner,
      memberId: HOSHI,
      seenTotalCents: seen,
      customerName: "Hoshi",
      customerEmail: "hoshi@example.com",
      customerPhone: "",
      pickup: { kind: "asap" as const },
      paymentMethod: "pay_at_pickup" as const,
      useReward: true,
    };
    const results = await Promise.all([placeOrder(base), placeOrder(base)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await balance(HOSHI)).toBe(0);
  });
});
