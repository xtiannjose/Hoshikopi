import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart } from "@/modules/cart";
import {
  cancelByCustomer,
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
