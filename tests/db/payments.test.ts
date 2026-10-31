import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { addLine, getCart } from "@/modules/cart";
import {
  expireUnpaid,
  placeOrder,
  receivePaymentWebhook,
} from "@/modules/ordering";
import { fakeProvider, type ProviderEvent } from "@/modules/payments";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
// Signs like the server's fake provider (same secret from .env.test).
const fake = fakeProvider(`fake-webhook:${process.env.BETTER_AUTH_SECRET}`);

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock("2026-11-02T01:00:00Z");
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

async function onlineOrder(drinks = 5) {
  const owner = { guestTokenHash: `guest-${Math.random()}` };
  const item = await db.menuItem.findUniqueOrThrow({
    where: { slug: "kopi-hitam" },
    include: {
      optionGroups: {
        include: { optionGroup: { include: { options: true } } },
      },
    },
  });
  const defaults = item.optionGroups.flatMap(({ optionGroup }) =>
    optionGroup.minSelect > 0
      ? [optionGroup.options.find((o) => o.isDefault)!.id]
      : []
  );
  await addLine(owner, {
    menuItemId: item.id,
    optionIds: defaults,
    quantity: drinks,
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
    paymentMethod: "gcash",
  });
  if (!result.ok) throw new Error(result.reason);
  return result;
}

async function webhook(event: Partial<ProviderEvent> & { id: string }) {
  const payment = await db.payment.findFirstOrThrow();
  const signed = fake.signedEvent({
    type: "paid",
    checkoutId: payment.providerCheckoutId,
    paymentId: "fake_pay_1",
    ...event,
  });
  return receivePaymentWebhook("fake", signed.body, signed.headers);
}

describe("online checkout (PAY-01)", () => {
  it("starts a Test Mode checkout and waits for payment, even for a Guest's 5 drinks", async () => {
    const order = await onlineOrder(5);
    expect(order.checkoutUrl).toMatch(/\/dev\/pay\/fake_cs_/);
    expect(
      await db.payment.findFirstOrThrow({ where: { orderId: order.orderId } })
    ).toMatchObject({
      status: "pending",
      provider: "fake",
      amountCents: 60000,
      method: "gcash",
    });
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.orderId } }))
        .status
    ).toBe("placed");
  });
});

describe("receivePaymentWebhook (PAY-03)", () => {
  it("marks the Order paid only from a verified webhook", async () => {
    const order = await onlineOrder();
    expect(await webhook({ id: "evt_1" })).toEqual({
      status: 200,
      result: "paid",
    });
    expect(
      await db.order.findUniqueOrThrow({ where: { id: order.orderId } })
    ).toMatchObject({ status: "paid" });
    expect(await db.payment.findFirstOrThrow()).toMatchObject({
      status: "paid",
      providerPaymentId: "fake_pay_1",
    });
  });

  it("acknowledges a replayed event and changes nothing", async () => {
    await onlineOrder();
    await webhook({ id: "evt_1" });
    expect(await webhook({ id: "evt_1" })).toEqual({
      status: 200,
      result: "duplicate",
    });
    expect(await db.paymentEvent.count()).toBe(1);
    expect(await db.orderEvent.count({ where: { toStatus: "paid" } })).toBe(1);
  });

  it("refuses a webhook whose signature does not match", async () => {
    const order = await onlineOrder();
    const payment = await db.payment.findFirstOrThrow();
    const signed = fake.signedEvent({
      id: "evt_2",
      type: "paid",
      checkoutId: payment.providerCheckoutId,
      paymentId: "x",
    });
    expect(
      await receivePaymentWebhook(
        "fake",
        signed.body.replace("evt_2", "evt_3"),
        signed.headers
      )
    ).toEqual({ status: 401, result: "bad_signature" });
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.orderId } }))
        .status
    ).toBe("placed");
    expect(await db.paymentEvent.count()).toBe(0);
  });

  it("records a failed payment and leaves the Order waiting", async () => {
    const order = await onlineOrder();
    expect(await webhook({ id: "evt_4", type: "failed" })).toEqual({
      status: 200,
      result: "failed",
    });
    expect((await db.payment.findFirstOrThrow()).status).toBe("failed");
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.orderId } }))
        .status
    ).toBe("placed");
  });

  it("answers 404 for another provider's route", async () => {
    expect(
      await receivePaymentWebhook("paymongo", "{}", new Headers())
    ).toEqual({
      status: 404,
      result: "wrong_provider",
    });
  });
});

describe("expiry (PAY-04)", () => {
  it("expires an Order unpaid after 15 minutes, closing its checkout", async () => {
    const order = await onlineOrder();
    const window = (
      await db.order.findUniqueOrThrow({ where: { id: order.orderId } })
    ).windowStart;
    expect(await expireUnpaid(new Date("2026-11-02T01:10:00Z"))).toBe(0);
    expect(await expireUnpaid(new Date("2026-11-02T01:16:00Z"))).toBe(1);
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.orderId } }))
        .status
    ).toBe("expired");
    expect((await db.payment.findFirstOrThrow()).status).toBe("expired");
    expect(
      await db.pickupWindowUsage.findUniqueOrThrow({
        where: { windowStart: window },
      })
    ).toMatchObject({ drinks: 0 });
  });

  it("ignores a payment webhook that comes after expiry", async () => {
    const order = await onlineOrder();
    await expireUnpaid(new Date("2026-11-02T01:16:00Z"));
    expect((await webhook({ id: "evt_late" })).result).toBe("ignored");
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: order.orderId } }))
        .status
    ).toBe("expired");
  });
});
