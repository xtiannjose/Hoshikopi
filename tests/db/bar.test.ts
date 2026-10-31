import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PaymentMethod } from "@/generated/prisma/enums";
import { freezeClock, unfreezeClock } from "@/lib/clock";
import { barBoard, expireUnpaid, transition } from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const at = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00+08:00`);
const annika = { kind: "staff", id: "seed-barista", role: "barista" } as const;
let n = 0;

beforeEach(async () => {
  n = 0;
  await resetDb(db);
  await seedDatabase(db);
  freezeClock(at("09:00"));
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

async function order(
  window: string,
  paymentMethod: PaymentMethod = "pay_at_pickup",
  placed = "08:55"
) {
  await db.pickupWindowUsage.upsert({
    where: { windowStart: at(window) },
    update: { drinks: { increment: 1 } },
    create: {
      windowStart: at(window),
      serviceDay: new Date("2026-11-02"),
      drinks: 1,
    },
  });
  return db.order.create({
    data: {
      serviceDay: new Date("2026-11-02"),
      code: `K-${String(++n).padStart(3, "0")}`,
      status: "placed",
      customerName: "Christian Santos",
      customerEmail: "christian@example.com",
      pickupKind: "scheduled",
      windowStart: at(window),
      paymentMethod,
      totalCents: 18500,
      accessTokenHash: "x",
      placedAt: at(placed),
      lines: {
        create: {
          name: "Hoshi Latte",
          options: [
            { group: "Size", name: "Large", deltaCents: 3000 },
            { group: "Milk", name: "Oat milk", deltaCents: 3500 },
          ],
          unitCents: 18500,
          quantity: 1,
          lineCents: 18500,
          isDrink: true,
          note: "less ice please",
        },
      },
    },
  });
}

describe("barBoard (STAFF-02)", () => {
  it("lists live Orders by Pickup Time, first names only, without unpaid online ones", async () => {
    await order("10:00");
    await order("09:15");
    await order("09:30", "gcash");
    const board = await barBoard(at("09:00"));
    expect(board.orders.map((o) => o.code)).toEqual(["K-002", "K-001"]);
    expect(board.orders[0]).toMatchObject({
      status: "placed",
      firstName: "Christian",
      payAtPickup: true,
      lines: [
        {
          quantity: 1,
          name: "Hoshi Latte",
          options: ["Large", "Oat milk"],
          note: "less ice please",
        },
      ],
    });
  });

  it("marks Scheduled Orders as make-next from Pickup Time minus Prep Time", async () => {
    await order("09:15");
    await order("11:00");
    // Empty queue: Prep Time 5 minutes, so 9:15 is due from 9:10.
    const board = await barBoard(at("09:12"));
    expect(board.orders.map((o) => [o.code, o.makeNext])).toEqual([
      ["K-001", true],
      ["K-002", false],
    ]);
  });

  it("changes its version when an Order moves, and drops closed Orders", async () => {
    const first = await order("09:15");
    const before = await barBoard(at("09:00"));
    await transition(first.id, "accepted", annika);
    const after = await barBoard(at("09:00"));
    expect(after.version).not.toBe(before.version);
    await transition(first.id, "preparing", annika);
    await transition(first.id, "ready", annika);
    await transition(first.id, "picked_up", annika);
    expect((await barBoard(at("09:00"))).orders).toHaveLength(0);
  });
});

describe("expireUnpaid (PAY-04, ADR 0007)", () => {
  it("expires online Orders unpaid after 15 minutes and frees their window", async () => {
    const old = await order("09:30", "maya", "08:40");
    const fresh = await order("09:30", "card", "08:50");
    const payAtPickup = await order("09:30", "pay_at_pickup", "08:00");
    expect(await expireUnpaid(at("09:00"))).toBe(1);
    const status = async (id: string) =>
      (await db.order.findUniqueOrThrow({ where: { id } })).status;
    expect(await status(old.id)).toBe("expired");
    expect(await status(fresh.id)).toBe("placed");
    expect(await status(payAtPickup.id)).toBe("placed");
    expect(
      await db.pickupWindowUsage.findUniqueOrThrow({
        where: { windowStart: at("09:30") },
      })
    ).toMatchObject({ drinks: 2 });
  });
});
