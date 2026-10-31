import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PaymentMethod } from "@/generated/prisma/enums";
import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart, type CartOwner } from "@/modules/cart";
import { balance } from "@/modules/loyalty";
import {
  cancelByCustomer,
  expireUnpaid,
  placeOrder,
  transition,
} from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const HOSHI = "seed-member";
const annika = { kind: "staff", id: "seed-barista", role: "barista" } as const;
const ids: Record<string, string> = {};
const items: Record<string, string> = {};

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  for (const o of await db.option.findMany()) ids[o.name] = o.id;
  for (const i of await db.menuItem.findMany()) items[i.slug] = i.id;
  freezeClock("2026-11-02T01:00:00Z");
});
afterEach(unfreezeClock);
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
