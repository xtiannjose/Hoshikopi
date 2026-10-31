import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart, type CartOwner } from "@/modules/cart";
import { placeOrder, type PlaceOrderInput } from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
// 9:00 AM Monday Nov 2 in Manila.
const NINE_AM = "2026-11-02T01:00:00Z";
const at = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00+08:00`);
let n = 0;
const guest = (): CartOwner => ({ guestTokenHash: `guest-${++n}` });
const ids: Record<string, string> = {};
const items: Record<string, string> = {};

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  for (const option of await db.option.findMany()) ids[option.name] = option.id;
  for (const item of await db.menuItem.findMany()) items[item.slug] = item.id;
  freezeClock(NINE_AM);
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

async function addLatte(owner: CartOwner, quantity = 1, milk = "Oat milk") {
  await addLine(owner, {
    menuItemId: items["hoshi-latte"],
    optionIds: [ids["Large"], ids[milk], ids["50%"], ids["Normal"]],
    quantity,
    note: "less ice please",
  });
}

async function input(
  owner: CartOwner,
  change: Partial<PlaceOrderInput> = {}
): Promise<PlaceOrderInput> {
  return {
    owner,
    memberId: null,
    seenTotalCents: (await getCart(owner)).totalCents,
    customerName: "Bea",
    customerEmail: "bea@example.com",
    customerPhone: "",
    pickup: { kind: "asap" },
    paymentMethod: "pay_at_pickup",
    ...change,
  };
}

describe("placeOrder: a Guest pays at pickup (ORD-03 to ORD-08, PAY-02)", () => {
  it("snapshots the Lines, takes window room, codes the Order and empties the Cart", async () => {
    const bea = guest();
    await addLatte(bea, 2);
    await addLine(bea, {
      menuItemId: items["ube-pandesal"],
      optionIds: [],
      quantity: 1,
      note: "",
    });
    const result = await placeOrder(await input(bea));
    expect(result).toMatchObject({ ok: true, code: "K-001" });
    if (!result.ok) return;

    const order = await db.order.findUniqueOrThrow({
      where: { id: result.orderId },
      include: { lines: true, events: true },
    });
    // Large Oat Hoshi Latte: 185 + 30 + 35 = 250, twice; Ube Pandesal 75.
    expect(order).toMatchObject({
      status: "placed",
      totalCents: 57500,
      pickupKind: "asap",
      paymentMethod: "pay_at_pickup",
    });
    expect(
      order.lines.map((l) => [l.name, l.unitCents, l.quantity, l.lineCents])
    ).toEqual([
      ["Hoshi Latte", 25000, 2, 50000],
      ["Ube Pandesal", 7500, 1, 7500],
    ]);
    expect(order.lines[0].note).toBe("less ice please");
    expect(order.lines[0].options).toEqual([
      { group: "Size", name: "Large", deltaCents: 3000 },
      { group: "Milk", name: "Oat milk", deltaCents: 3500 },
      { group: "Sugar Level", name: "50%", deltaCents: 0 },
      { group: "Ice Level", name: "Normal", deltaCents: 0 },
    ]);
    expect(order.events.map((e) => e.toStatus)).toEqual(["placed"]);
    // The link token is returned once; only its hash is stored.
    expect(result.accessToken).toHaveLength(43);
    expect(order.accessTokenHash).not.toContain(result.accessToken);
    expect(
      await db.pickupWindowUsage.findUniqueOrThrow({
        where: { windowStart: order.windowStart },
      })
    ).toMatchObject({ drinks: 2, food: 1 });
    expect((await getCart(bea)).lines).toHaveLength(0);
  });

  it("puts As Soon As Possible in the first window after now + Prep Time", async () => {
    const bea = guest();
    await addLatte(bea);
    const result = await placeOrder(await input(bea));
    // Empty queue: Prep Time 5 minutes, ready 9:05, first window 9:15.
    expect(result.ok && result.windowStart).toEqual(at("09:15"));
  });

  it("keeps a later menu edit away from the placed Order", async () => {
    const bea = guest();
    await addLatte(bea);
    const result = await placeOrder(await input(bea));
    await db.menuItem.update({
      where: { id: items["hoshi-latte"] },
      data: { name: "Hoshi Latte 2", baseCents: 99900 },
    });
    const line = await db.orderLine.findFirstOrThrow({
      where: { orderId: result.ok ? result.orderId : "" },
    });
    expect(line).toMatchObject({ name: "Hoshi Latte", unitCents: 25000 });
  });
});

describe("placeOrder refusals", () => {
  it("refuses when the cafe is closed or Ordering Paused (ORD-07)", async () => {
    const bea = guest();
    await addLatte(bea);
    freezeClock(at("20:45"));
    expect(await placeOrder(await input(bea))).toEqual({
      ok: false,
      reason: "closed",
    });
    freezeClock(NINE_AM);
    await db.cafeSettings.update({
      where: { id: 1 },
      data: { orderingPausedUntil: at("10:00") },
    });
    expect(await placeOrder(await input(bea))).toEqual({
      ok: false,
      reason: "paused",
    });
  });

  it("refuses when the total changed since the Customer saw it", async () => {
    const bea = guest();
    await addLatte(bea);
    const seen = await input(bea);
    await db.menuItem.update({
      where: { id: items["hoshi-latte"] },
      data: { baseCents: 19500 },
    });
    expect(await placeOrder(seen)).toEqual({
      ok: false,
      reason: "price_changed",
      totalCents: 26000,
    });
  });

  it("refuses an empty Cart or one with a Line that can't be ordered", async () => {
    expect(await placeOrder(await input(guest()))).toEqual({
      ok: false,
      reason: "cart_problem",
    });
    const bea = guest();
    await addLatte(bea);
    await db.option.update({
      where: { id: ids["Oat milk"] },
      data: { soldOutOn: new Date("2026-11-02") },
    });
    expect((await placeOrder(await input(bea))).ok).toBe(false);
  });

  it("caps an Order at 15 drinks and a Guest's Pay at Pickup at 4", async () => {
    const big = guest();
    await addLatte(big, 16);
    expect(await placeOrder(await input(big))).toEqual({
      ok: false,
      reason: "too_many_drinks",
    });
    const five = guest();
    await addLatte(five, 5);
    expect(await placeOrder(await input(five))).toEqual({
      ok: false,
      reason: "pay_at_pickup_limit",
    });
    expect(
      (await placeOrder(await input(five, { memberId: "seed-member" }))).ok
    ).toBe(true);
  });

  it("needs a name and an email or phone (ORD-05)", async () => {
    const bea = guest();
    await addLatte(bea);
    const result = await placeOrder(
      await input(bea, {
        customerName: " ",
        customerEmail: "",
        customerPhone: "",
      })
    );
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("refuses a Scheduled window that is past or full, naming the next free one (ORD-04)", async () => {
    const bea = guest();
    await addLatte(bea, 2);
    expect(
      await placeOrder(
        await input(bea, {
          pickup: { kind: "scheduled", windowStart: at("08:00") },
        })
      )
    ).toMatchObject({ ok: false, reason: "window_unavailable" });

    await db.pickupWindowUsage.create({
      data: {
        windowStart: at("10:00"),
        serviceDay: new Date("2026-11-02"),
        drinks: 11,
        food: 0,
      },
    });
    expect(
      await placeOrder(
        await input(bea, {
          pickup: { kind: "scheduled", windowStart: at("10:00") },
        })
      )
    ).toEqual({
      ok: false,
      reason: "window_full",
      nextWindow: at("10:15"),
    });
  });

  it("lets only one of two racing Orders take a window's last room", async () => {
    await db.pickupWindowUsage.create({
      data: {
        windowStart: at("10:00"),
        serviceDay: new Date("2026-11-02"),
        drinks: 10,
        food: 0,
      },
    });
    const [a, b] = [guest(), guest()];
    await addLatte(a, 2);
    await addLatte(b, 2, "Whole milk");
    const scheduled = { kind: "scheduled" as const, windowStart: at("10:00") };
    const results = await Promise.all([
      placeOrder(await input(a, { pickup: scheduled })),
      placeOrder(await input(b, { pickup: scheduled })),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(
      await db.pickupWindowUsage.findUniqueOrThrow({
        where: { windowStart: at("10:00") },
      })
    ).toMatchObject({ drinks: 12 });
  });
});
