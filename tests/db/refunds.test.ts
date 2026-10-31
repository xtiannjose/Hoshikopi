import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PaymentMethod } from "@/generated/prisma/enums";
import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart } from "@/modules/cart";
import {
  cancelByCustomer,
  placeOrder,
  receivePaymentWebhook,
  refundOrder,
  transition,
} from "@/modules/ordering";
import { fakeProvider } from "@/modules/payments";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const fake = fakeProvider(`fake-webhook:${process.env.BETTER_AUTH_SECRET}`);
const hoshi = { kind: "staff", id: "seed-manager", role: "manager" } as const;
const annika = { kind: "staff", id: "seed-barista", role: "barista" } as const;

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock("2026-11-02T01:00:00Z");
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

async function order(paymentMethod: PaymentMethod, pay = true) {
  const owner = { guestTokenHash: `guest-${Math.random()}` };
  const item = await db.menuItem.findUniqueOrThrow({
    where: { slug: "ube-pandesal" },
  });
  await addLine(owner, {
    menuItemId: item.id,
    optionIds: [],
    quantity: 2,
    note: "",
  });
  const result = await placeOrder({
    owner,
    memberId: null,
    seenTotalCents: (await getCart(owner)).totalCents,
    customerName: "Christian",
    customerEmail: "christian@example.com",
    customerPhone: "",
    pickup: { kind: "asap" },
    paymentMethod,
  });
  if (!result.ok) throw new Error(result.reason);
  if (pay && paymentMethod !== "pay_at_pickup") {
    const payment = await db.payment.findUniqueOrThrow({
      where: { orderId: result.orderId },
    });
    const signed = fake.signedEvent({
      id: `evt_${result.orderId}`,
      type: "paid",
      checkoutId: payment.providerCheckoutId,
      paymentId: `fake_pay_${result.orderId}`,
    });
    await receivePaymentWebhook("fake", signed.body, signed.headers);
  }
  return result;
}

async function pickUp(orderId: string) {
  for (const to of ["accepted", "preparing", "ready", "picked_up"] as const) {
    await transition(orderId, to, annika);
  }
}

describe("refundOrder (PAY-05, STAFF-07)", () => {
  it("refunds a picked-up online Order in full through the provider", async () => {
    const placed = await order("card");
    await pickUp(placed.orderId);
    expect(await refundOrder(placed.orderId, hoshi)).toEqual({ ok: true });
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: placed.orderId } }))
        .status
    ).toBe("refunded");
    const payment = await db.payment.findUniqueOrThrow({
      where: { orderId: placed.orderId },
      include: { refunds: true },
    });
    expect(payment.status).toBe("refunded");
    expect(payment.refunds).toEqual([
      expect.objectContaining({ amountCents: 15000, actorId: "seed-manager" }),
    ]);
  });

  it("refunds once, however many times it is asked", async () => {
    const placed = await order("gcash");
    await pickUp(placed.orderId);
    const results = await Promise.all([
      refundOrder(placed.orderId, hoshi),
      refundOrder(placed.orderId, hoshi),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await db.refund.count()).toBe(1);
  });

  it("is for Managers only", async () => {
    const placed = await order("maya");
    await pickUp(placed.orderId);
    expect(await refundOrder(placed.orderId, annika)).toEqual({
      ok: false,
      reason: "not_allowed",
    });
    expect(await db.refund.count()).toBe(0);
  });

  it("refunds a paid Order the Customer cancels (ORD-09)", async () => {
    const placed = await order("gcash");
    expect(
      (await cancelByCustomer(placed.orderId, placed.accessToken)).ok
    ).toBe(true);
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: placed.orderId } }))
        .status
    ).toBe("refunded");
    expect(await db.refund.count()).toBe(1);
  });

  it("refunds Pay at Pickup at the counter, with no provider call", async () => {
    const placed = await order("pay_at_pickup");
    await pickUp(placed.orderId);
    expect(await refundOrder(placed.orderId, hoshi)).toEqual({ ok: true });
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: placed.orderId } }))
        .status
    ).toBe("refunded");
    expect(await db.refund.count()).toBe(0);
  });

  it("closes the checkout of an unpaid online Order its Customer cancels", async () => {
    const placed = await order("gcash", false);
    expect(
      (await cancelByCustomer(placed.orderId, placed.accessToken)).ok
    ).toBe(true);
    const payment = await db.payment.findUniqueOrThrow({
      where: { orderId: placed.orderId },
    });
    expect(payment.status).toBe("expired");
  });

  it("refuses an Order that was never paid", async () => {
    const placed = await order("pay_at_pickup");
    await cancelByCustomer(placed.orderId, placed.accessToken);
    expect(await refundOrder(placed.orderId, hoshi)).toEqual({
      ok: false,
      reason: "not_allowed",
    });
  });
});
