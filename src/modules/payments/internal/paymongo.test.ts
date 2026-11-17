import { describe, expect, it } from "vitest";

import { payMongoProvider } from "./paymongo";

const provider = payMongoProvider("sk_test_x", "whsk_test_x");

/** A checkout_session.payment.paid event, shaped as PayMongo sends it. */
const event = (payments: unknown[]) =>
  JSON.stringify({
    data: {
      id: "evt_1",
      attributes: {
        type: "checkout_session.payment.paid",
        data: { id: "cs_1", attributes: { payments } },
      },
    },
  });

// The event was trusted for its ids only, and for the first payment even
// when an earlier try had failed (audit PAY-08).
describe("payMongoProvider().parseEvent", () => {
  it("takes the payment that went through, with its amount and currency", () => {
    expect(
      provider.parseEvent(
        event([
          {
            id: "pay_failed",
            attributes: { amount: 25000, currency: "PHP", status: "failed" },
          },
          {
            id: "pay_ok",
            attributes: { amount: 25000, currency: "PHP", status: "paid" },
          },
        ])
      )
    ).toEqual({
      id: "evt_1",
      type: "paid",
      checkoutId: "cs_1",
      paymentId: "pay_ok",
      amountCents: 25000,
      currency: "PHP",
    });
  });

  it("leaves the amount unknown when PayMongo sends none", () => {
    expect(provider.parseEvent(event([{ id: "pay_1" }]))).toMatchObject({
      paymentId: "pay_1",
      amountCents: null,
      currency: null,
    });
  });
});
