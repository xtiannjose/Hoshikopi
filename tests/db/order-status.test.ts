import { afterAll, beforeEach, describe, expect, it } from "vitest";

import type { PaymentMethod } from "@/generated/prisma/enums";
import { nextOrderCode, transition, type Actor } from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const WINDOW = new Date("2026-11-02T02:00:00Z");

const customer: Actor = { kind: "customer" };
const webhook: Actor = { kind: "webhook" };
const system: Actor = { kind: "system" };
const annika: Actor = { kind: "staff", id: "seed-barista", role: "barista" };
const hoshi: Actor = { kind: "staff", id: "seed-manager", role: "manager" };

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
});
afterAll(() => db.$disconnect());

/** An Order of 2 drinks and 1 food Line holding room in WINDOW. */
async function placedOrder(paymentMethod: PaymentMethod = "pay_at_pickup") {
  await db.pickupWindowUsage.upsert({
    where: { windowStart: WINDOW },
    update: { drinks: { increment: 2 }, food: { increment: 1 } },
    create: {
      windowStart: WINDOW,
      serviceDay: new Date("2026-11-02"),
      drinks: 2,
      food: 1,
    },
  });
  return db.order.create({
    data: {
      serviceDay: new Date("2026-11-02"),
      code: `K-${Math.random().toString().slice(2, 8)}`,
      status: "placed",
      customerName: "Christian",
      customerEmail: "christian@hoshikopi.example",
      pickupKind: "scheduled",
      windowStart: WINDOW,
      paymentMethod,
      totalCents: 44500,
      accessTokenHash: "x",
      placedAt: new Date(),
      lines: {
        create: [
          {
            name: "Hoshi Latte",
            options: [],
            unitCents: 18500,
            quantity: 2,
            lineCents: 37000,
            isDrink: true,
          },
          {
            name: "Ube Pandesal",
            options: [],
            unitCents: 7500,
            quantity: 1,
            lineCents: 7500,
            isDrink: false,
          },
        ],
      },
      events: { create: { toStatus: "placed", actorKind: "customer" } },
    },
  });
}

const usage = async () =>
  db.pickupWindowUsage.findUniqueOrThrow({ where: { windowStart: WINDOW } });

const statusOf = async (id: string) =>
  (await db.order.findUniqueOrThrow({ where: { id } })).status;

describe("transition: Pay at Pickup through the bar", () => {
  it("moves Placed > Accepted > Preparing > Ready > Picked Up", async () => {
    const order = await placedOrder();
    for (const to of ["accepted", "preparing", "ready", "picked_up"] as const) {
      expect(await transition(order.id, to, annika)).toMatchObject({
        ok: true,
      });
    }
    const done = await db.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { events: { orderBy: { at: "asc" } } },
    });
    expect(done.status).toBe("picked_up");
    expect(done.paidAtCounter).toBe(true);
    expect(done.acceptedAt && done.readyAt && done.pickedUpAt).toBeTruthy();
    expect(
      done.events.map((e) => `${e.fromStatus}>${e.toStatus}:${e.actorKind}`)
    ).toEqual([
      "null>placed:customer",
      "placed>accepted:staff",
      "accepted>preparing:staff",
      "preparing>ready:staff",
      "ready>picked_up:staff",
    ]);
  });

  it("refuses skipping a step", async () => {
    const order = await placedOrder();
    expect(await transition(order.id, "ready", annika)).toEqual({
      ok: false,
      reason: "not_allowed",
      status: "placed",
    });
  });
});

describe("transition: online payment", () => {
  it("needs a verified payment before the bar accepts", async () => {
    const order = await placedOrder("gcash");
    expect((await transition(order.id, "accepted", annika)).ok).toBe(false);
    expect((await transition(order.id, "paid", annika)).ok).toBe(false);
    expect((await transition(order.id, "paid", webhook)).ok).toBe(true);
    expect((await transition(order.id, "accepted", annika)).ok).toBe(true);
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.id } })).paidAt
    ).toBeTruthy();
  });

  it("expires an unpaid online Order and gives back its window", async () => {
    const order = await placedOrder("maya");
    expect(await usage()).toMatchObject({ drinks: 2, food: 1 });
    expect((await transition(order.id, "expired", system)).ok).toBe(true);
    expect(await usage()).toMatchObject({ drinks: 0, food: 0 });
  });

  it("never expires a Pay at Pickup Order", async () => {
    const order = await placedOrder();
    expect((await transition(order.id, "expired", system)).ok).toBe(false);
  });
});

describe("transition: cancelling (ORD-09)", () => {
  it("lets the Customer cancel before Accepted and gives back the window", async () => {
    const order = await placedOrder();
    expect((await transition(order.id, "cancelled", customer)).ok).toBe(true);
    expect(await usage()).toMatchObject({ drinks: 0, food: 0 });
  });

  it("refuses a Customer cancel once the bar accepted", async () => {
    const order = await placedOrder();
    await transition(order.id, "accepted", annika);
    expect(await transition(order.id, "cancelled", customer)).toEqual({
      ok: false,
      reason: "not_allowed",
      status: "accepted",
    });
  });

  it("lets a Manager cancel up to Ready, with a reason", async () => {
    const order = await placedOrder();
    await transition(order.id, "accepted", annika);
    await transition(order.id, "preparing", annika);
    expect(await transition(order.id, "cancelled", hoshi)).toEqual({
      ok: false,
      reason: "reason_required",
      status: "preparing",
    });
    expect(
      (await transition(order.id, "cancelled", annika, "Out of milk")).ok
    ).toBe(false);
    expect(
      (await transition(order.id, "cancelled", hoshi, "Out of milk")).ok
    ).toBe(true);
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.id } }))
        .cancelReason
    ).toBe("Out of milk");
  });

  it("gives the window back once when two cancels race", async () => {
    const order = await placedOrder();
    const results = await Promise.all([
      transition(order.id, "cancelled", customer),
      transition(order.id, "cancelled", customer),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await usage()).toMatchObject({ drinks: 0, food: 0 });
  });
});

describe("transition: Refunds", () => {
  it("refunds a cancelled paid Order once, without giving the window back twice", async () => {
    const order = await placedOrder("card");
    await transition(order.id, "paid", webhook);
    await transition(order.id, "cancelled", customer);
    expect((await transition(order.id, "refunded", annika)).ok).toBe(false);
    expect((await transition(order.id, "refunded", hoshi)).ok).toBe(true);
    expect(await usage()).toMatchObject({ drinks: 0, food: 0 });
    expect(await statusOf(order.id)).toBe("refunded");
  });

  it("refuses refunding a cancelled Order that was never paid", async () => {
    const order = await placedOrder();
    await transition(order.id, "cancelled", customer);
    expect((await transition(order.id, "refunded", hoshi)).ok).toBe(false);
  });

  it("refunds a Picked Up Order", async () => {
    const order = await placedOrder();
    for (const to of ["accepted", "preparing", "ready", "picked_up"] as const) {
      await transition(order.id, to, annika);
    }
    expect((await transition(order.id, "refunded", hoshi)).ok).toBe(true);
  });
});

describe("nextOrderCode", () => {
  it("counts up per service day and restarts the next day", async () => {
    expect(await nextOrderCode("2026-11-02", "K")).toBe("K-001");
    expect(await nextOrderCode("2026-11-02", "K")).toBe("K-002");
    expect(await nextOrderCode("2026-11-03", "K")).toBe("K-001");
  });
});
