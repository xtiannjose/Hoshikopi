import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart } from "@/modules/cart";
import { starTotals } from "@/modules/loyalty";
import {
  cancelOrder,
  placeOrder,
  popularDrinks,
  salesReport,
  transition,
} from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const HOSHI = "seed-member";
const annika = { kind: "staff", id: "seed-barista", role: "barista" } as const;
const christian = {
  kind: "staff",
  id: "seed-manager",
  role: "manager",
} as const;
const items: Record<string, string> = {};

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  for (const item of await db.menuItem.findMany()) items[item.slug] = item.id;
  freezeClock("2026-11-02T01:00:00Z"); // 9:00 AM Monday, Nov 2 in Manila
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

/** The default Options a Menu Item's page starts with. */
async function defaults(slug: string) {
  const item = await db.menuItem.findUniqueOrThrow({
    where: { slug },
    include: {
      optionGroups: {
        include: { optionGroup: { include: { options: true } } },
      },
    },
  });
  return item.optionGroups.flatMap(({ optionGroup }) =>
    optionGroup.options.filter((option) => option.isDefault).map((o) => o.id)
  );
}

/** An Order with each item's default Options, Picked Up unless told not. */
async function order(
  lines: [slug: string, quantity: number][],
  { memberId = null as string | null, pickUp = true } = {}
) {
  const owner = memberId
    ? { memberId }
    : { guestTokenHash: `g-${Math.random()}` };
  for (const [slug, quantity] of lines) {
    await addLine(owner, {
      menuItemId: items[slug],
      optionIds: await defaults(slug),
      quantity,
      note: "",
    });
  }
  const result = await placeOrder({
    owner,
    memberId,
    seenTotalCents: (await getCart(owner)).totalCents,
    customerName: "Hoshi",
    customerEmail: "hoshi@example.com",
    customerPhone: "",
    pickup: { kind: "asap" },
    paymentMethod: "pay_at_pickup",
  });
  if (!result.ok) throw new Error(result.reason);
  if (pickUp) {
    for (const to of ["accepted", "preparing", "ready", "picked_up"] as const) {
      await transition(result.orderId, to, annika);
    }
  }
  return result.orderId;
}

describe("salesReport (STAFF-08)", () => {
  it("adds up Picked Up Orders by Manila day, top items and outcomes", async () => {
    await order([["ube-pandesal", 3]]); // PHP 225
    await order([
      ["ensaymada", 1],
      ["ube-pandesal", 1],
    ]); // PHP 95 + 75
    const cancelled = await order([["banana-bread", 3]], { pickUp: false });
    await cancelOrder(cancelled, christian, "Out of bread");
    // Yesterday in Manila, inside a 7-day report.
    freezeClock("2026-11-01T02:00:00Z");
    await order([["ensaymada", 2]]);
    freezeClock("2026-11-02T01:00:00Z");

    const report = await salesReport(7);
    expect(report.days).toEqual([
      { day: "2026-11-02", orders: 2, totalCents: 39500 },
      { day: "2026-11-01", orders: 1, totalCents: 19000 },
    ]);
    expect(report.totals).toEqual({ orders: 3, totalCents: 58500 });
    expect(report.topItems).toEqual([
      { name: "Ube Pandesal", quantity: 4, totalCents: 30000 },
      { name: "Ensaymada", quantity: 3, totalCents: 28500 },
    ]);
    expect(report.outcomes).toMatchObject({ cancelled: 1, refunded: 0 });
  });

  it("leaves out days before the report's window", async () => {
    freezeClock("2026-10-20T02:00:00Z");
    await order([["ube-pandesal", 1]]);
    freezeClock("2026-11-02T01:00:00Z");
    expect((await salesReport(7)).totals).toEqual({ orders: 0, totalCents: 0 });
  });
});

describe("starTotals (STAFF-08)", () => {
  it("counts Stars earned and redeemed in the window", async () => {
    await db.starEntry.create({
      data: { memberId: HOSHI, kind: "adjust", stars: 9, reason: "test" },
    });
    // A free drink: 9 Stars reserved, kept when Picked Up.
    const owner = { memberId: HOSHI };
    await addLine(owner, {
      menuItemId: items["kopi-hitam"],
      optionIds: await defaults("kopi-hitam"),
      quantity: 2,
      note: "",
    });
    const placed = await placeOrder({
      owner,
      memberId: HOSHI,
      // One of the two is free: its Base Price comes off.
      seenTotalCents:
        (await getCart(owner)).totalCents -
        (await db.menuItem.findUniqueOrThrow({ where: { slug: "kopi-hitam" } }))
          .baseCents,
      customerName: "Hoshi",
      customerEmail: "hoshi@example.com",
      customerPhone: "",
      pickup: { kind: "asap" },
      paymentMethod: "pay_at_pickup",
      useReward: true,
    });
    if (!placed.ok) throw new Error(placed.reason);
    for (const to of ["accepted", "preparing", "ready", "picked_up"] as const) {
      await transition(placed.orderId, to, annika);
    }
    expect(await starTotals(7)).toMatchObject({ earned: 1, redeemed: 9 });
  });
});

describe("popularDrinks (MENU-09)", () => {
  it("ranks this week's drinks once there are enough Orders", async () => {
    expect(await popularDrinks()).toEqual([]);
    for (let i = 0; i < 4; i++) await order([["cold-brew", 2]]);
    await order([["calamansi-honey-soda", 1]]);
    await order([["ube-pandesal", 5]]); // food is not a drink
    expect(await popularDrinks()).toEqual([
      { menuItemId: items["cold-brew"], name: "Cold Brew" },
      {
        menuItemId: items["calamansi-honey-soda"],
        name: "Calamansi Honey Soda",
      },
    ]);
  });
});
