import { describe, expect, it } from "vitest";

import { fakeProvider } from "./fake";
import { providerFor } from "./provider";

const env = (values: Record<string, string>) =>
  values as unknown as NodeJS.ProcessEnv;

describe("providerFor (ADR 0003, PAY-06)", () => {
  it("uses the fake provider locally and on Vercel preview addresses", () => {
    expect(providerFor(env({ PAYMENT_PROVIDER: "fake" })).name).toBe("fake");
    expect(
      providerFor(
        env({
          PAYMENT_PROVIDER: "fake",
          NODE_ENV: "production",
          NEXT_PUBLIC_SITE_URL: "https://hoshikopi.vercel.app",
        })
      ).name
    ).toBe("fake");
  });

  it("refuses the fake provider on a production domain", () => {
    expect(() =>
      providerFor(
        env({
          PAYMENT_PROVIDER: "fake",
          NODE_ENV: "production",
          NEXT_PUBLIC_SITE_URL: "https://hoshikopi.ph",
        })
      )
    ).toThrow(/production domain/);
  });

  it("refuses any PayMongo key that is not a test key", () => {
    expect(() =>
      providerFor(
        env({
          PAYMENT_PROVIDER: "paymongo",
          PAYMONGO_SECRET_KEY: "sk_live_abc",
        })
      )
    ).toThrow(/test key/);
    expect(() =>
      providerFor(
        env({ PAYMENT_PROVIDER: "paymongo", PAYMONGO_SECRET_KEY: "" })
      )
    ).toThrow(/test key/);
    expect(
      providerFor(
        env({
          PAYMENT_PROVIDER: "paymongo",
          PAYMONGO_SECRET_KEY: "sk_test_abc",
          PAYMONGO_WEBHOOK_SECRET: "whsk_test",
        })
      ).name
    ).toBe("paymongo");
  });
});

describe("fake provider webhooks", () => {
  const fake = fakeProvider("a-secret-for-tests");

  it("verifies its own signed events and refuses tampered ones", async () => {
    const { body, headers } = fake.signedEvent({
      id: "evt_1",
      type: "paid",
      checkoutId: "cs_1",
      paymentId: "pay_1",
    });
    expect(fake.verifyWebhook(body, headers)).toBe(true);
    expect(fake.verifyWebhook(body.replace("cs_1", "cs_2"), headers)).toBe(
      false
    );
    expect(fake.verifyWebhook(body, new Headers())).toBe(false);
    expect(fake.parseEvent(body)).toEqual({
      id: "evt_1",
      type: "paid",
      checkoutId: "cs_1",
      paymentId: "pay_1",
    });
  });

  it("hosts its checkout locally", async () => {
    const checkout = await fake.createCheckout({
      paymentId: "p1",
      orderCode: "K-001",
      amountCents: 18500,
      method: "gcash",
      returnUrl: "http://localhost:3000/orders/x?t=y",
    });
    expect(checkout.checkoutUrl).toMatch(/\/dev\/pay\/fake_cs_/);
  });
});

describe("PayMongo webhook signature", () => {
  it("checks the test-mode signature over timestamp and raw body", async () => {
    const { createHmac } = await import("node:crypto");
    const provider = providerFor(
      env({
        PAYMENT_PROVIDER: "paymongo",
        PAYMONGO_SECRET_KEY: "sk_test_abc",
        PAYMONGO_WEBHOOK_SECRET: "whsk_test",
      })
    );
    const body = JSON.stringify({
      data: {
        id: "evt_123",
        attributes: {
          type: "checkout_session.payment.paid",
          data: { id: "cs_9", attributes: { payments: [{ id: "pay_7" }] } },
        },
      },
    });
    const te = createHmac("sha256", "whsk_test")
      .update(`1730000000.${body}`)
      .digest("hex");
    const headers = new Headers({
      "paymongo-signature": `t=1730000000,te=${te},li=`,
    });
    expect(provider.verifyWebhook(body, headers)).toBe(true);
    expect(provider.verifyWebhook(`${body} `, headers)).toBe(false);
    expect(provider.parseEvent(body)).toEqual({
      id: "evt_123",
      type: "paid",
      checkoutId: "cs_9",
      paymentId: "pay_7",
    });
  });
});
