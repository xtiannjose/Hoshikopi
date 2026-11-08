import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart } from "@/modules/cart";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import {
  advanceInDemo,
  cancelByCustomer,
  getOrderForCustomer,
  orderVersion,
  placeOrder,
  transition,
} from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const owner = { guestTokenHash: "hoshi-browser" };
const annika = { kind: "staff", id: "seed-barista", role: "barista" } as const;

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock("2026-11-02T01:00:00Z");
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

async function placed() {
  const item = await db.menuItem.findUniqueOrThrow({
    where: { slug: "ube-pandesal" },
  });
  await addLine(owner, {
    menuItemId: item.id,
    optionIds: [],
    quantity: 1,
    note: "",
  });
  const result = await placeOrder({
    owner,
    memberId: null,
    seenTotalCents: (await getCart(owner)).totalCents,
    customerName: "Hoshi",
    customerEmail: "hoshi@example.com",
    customerPhone: "",
    pickup: { kind: "asap" },
    paymentMethod: "pay_at_pickup",
  });
  if (!result.ok) throw new Error(result.reason);
  return result;
}

describe("cancelByCustomer (ORD-09)", () => {
  it("cancels with the link token, before the bar accepts", async () => {
    const order = await placed();
    expect(await cancelByCustomer(order.orderId, "wrong")).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect((await cancelByCustomer(order.orderId, order.accessToken)).ok).toBe(
      true
    );
  });

  it("refuses once the bar accepted", async () => {
    const order = await placed();
    await transition(order.orderId, "accepted", annika);
    expect(await cancelByCustomer(order.orderId, order.accessToken)).toEqual({
      ok: false,
      reason: "not_allowed",
      status: "accepted",
    });
  });
});

let code = 100;

/** Another Customer's Order on the same service day, straight in the table. */
async function other(
  windowStart: Date,
  status: OrderStatus,
  drinks: number,
  {
    paymentMethod = "pay_at_pickup",
    placedAt = new Date("2026-11-02T00:50:00Z"),
  }: { paymentMethod?: PaymentMethod; placedAt?: Date } = {}
) {
  const line = (name: string, quantity: number, isDrink: boolean) => ({
    name,
    quantity,
    isDrink,
    options: [],
    unitCents: 16500,
    lineCents: 16500 * quantity,
  });
  return db.order.create({
    data: {
      serviceDay: new Date("2026-11-02"),
      code: `K-${++code}`,
      status,
      customerName: "Lia Cruz",
      customerEmail: "lia@example.com",
      pickupKind: "asap",
      windowStart,
      paymentMethod,
      totalCents: 16500,
      accessTokenHash: "x",
      placedAt,
      lines: {
        create: [
          line("Hoshi Latte", drinks, true),
          line("Ube Pandesal", 4, false),
        ],
      },
    },
  });
}

const minutes = (at: Date, by: number) => new Date(at.getTime() + by * 60_000);

describe("drinks ahead on the Order page (FEAT-03)", () => {
  it("counts drinks the bar makes first, in Bar Screen order, and the poll sees it change", async () => {
    const mine = await placed();
    const first = await getOrderForCustomer(mine.orderId, mine.accessToken);
    expect(first?.drinksAhead).toBe(0);
    const window = first!.windowStart;

    const earlier = await other(minutes(window, -15), "accepted", 2);
    await other(window, "placed", 1); // same window, placed before mine
    await other(window, "placed", 5, {
      placedAt: new Date("2026-11-02T01:05:00Z"), // placed after mine
    });
    await other(minutes(window, -15), "ready", 3); // done, waiting at the counter
    await other(minutes(window, -15), "placed", 4, { paymentMethod: "gcash" }); // not paid, not on the bar
    await other(minutes(window, 15), "paid", 6); // a later Pickup Time

    const view = await getOrderForCustomer(mine.orderId, mine.accessToken);
    expect(view?.drinksAhead).toBe(3);
    const before = await orderVersion(mine.orderId, mine.accessToken);
    expect(before?.version).toBe(view?.version);

    await transition(earlier.id, "preparing", annika);
    await transition(earlier.id, "ready", annika);
    const after = await orderVersion(mine.orderId, mine.accessToken);
    expect(after?.version).not.toBe(before?.version);
    expect(
      (await getOrderForCustomer(mine.orderId, mine.accessToken))?.drinksAhead
    ).toBe(1);
  });

  it("is not given for a Scheduled Pickup, or once the bar is making the Order", async () => {
    const mine = await placed();
    await transition(mine.orderId, "accepted", annika);
    expect(
      (await getOrderForCustomer(mine.orderId, mine.accessToken))?.drinksAhead
    ).toBe(0);
    await transition(mine.orderId, "preparing", annika);
    expect(
      (await getOrderForCustomer(mine.orderId, mine.accessToken))?.drinksAhead
    ).toBeNull();

    const later = await placed();
    await db.order.update({
      where: { id: later.orderId },
      data: { pickupKind: "scheduled" },
    });
    expect(
      (await getOrderForCustomer(later.orderId, later.accessToken))?.drinksAhead
    ).toBeNull();
  });
});

describe("orderVersion (polling, ADR 0009)", () => {
  it("changes when the Order Status changes, and needs the token", async () => {
    const order = await placed();
    const before = await orderVersion(order.orderId, order.accessToken);
    expect(before).toMatchObject({ status: "placed" });
    expect(await orderVersion(order.orderId, "wrong")).toBeNull();
    freezeClock("2026-11-02T01:05:00Z");
    await transition(order.orderId, "accepted", annika);
    const after = await orderVersion(order.orderId, order.accessToken);
    expect(after?.status).toBe("accepted");
    expect(after?.version).not.toBe(before?.version);
  });
});

describe("Demo Mode: the visitor plays the barista (8.1)", () => {
  it("moves their own Order one step at a time with its link, recorded as demo", async () => {
    const order = await placed();
    expect(await advanceInDemo(order.orderId, "wrong", "placed")).toMatchObject(
      { ok: false, reason: "not_found" }
    );
    const steps: string[] = [];
    let from: OrderStatus = "placed";
    for (let i = 0; i < 4; i++) {
      const result = await advanceInDemo(
        order.orderId,
        order.accessToken,
        from
      );
      if (!result.ok) throw new Error(result.reason);
      steps.push(result.order.status);
      from = result.order.status;
    }
    expect(steps).toEqual(["accepted", "preparing", "ready", "picked_up"]);
    // Picked Up is the end: nothing left to play.
    expect(
      await advanceInDemo(order.orderId, order.accessToken, "picked_up")
    ).toMatchObject({ ok: false, reason: "not_allowed" });
    const events = await db.orderEvent.findMany({
      where: { orderId: order.orderId, toStatus: { not: "placed" } },
      select: { actorKind: true },
    });
    expect(events.map((e) => e.actorKind)).toEqual([
      "demo",
      "demo",
      "demo",
      "demo",
    ]);
  });

  it("leaves an unpaid online Order to the checkout", async () => {
    const order = await placed();
    await db.order.update({
      where: { id: order.orderId },
      data: { paymentMethod: "gcash" },
    });
    expect(
      await advanceInDemo(order.orderId, order.accessToken, "placed")
    ).toMatchObject({ ok: false, reason: "not_allowed", status: "placed" });
  });

  it("moves one step for a double tap, in a row or at once (audit 7.5)", async () => {
    const order = await placed();
    expect(
      (await advanceInDemo(order.orderId, order.accessToken, "placed")).ok
    ).toBe(true);
    // The second tap of the same button still says "placed".
    expect(
      await advanceInDemo(order.orderId, order.accessToken, "placed")
    ).toMatchObject({ ok: false, reason: "not_allowed", status: "accepted" });
    const both = await Promise.all([
      advanceInDemo(order.orderId, order.accessToken, "accepted"),
      advanceInDemo(order.orderId, order.accessToken, "accepted"),
    ]);
    expect(both.filter((r) => r.ok)).toHaveLength(1);
    const after = await db.order.findUniqueOrThrow({
      where: { id: order.orderId },
    });
    expect(after.status).toBe("preparing");
  });
});
