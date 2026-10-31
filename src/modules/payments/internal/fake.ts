import { randomUUID } from "node:crypto";

import { hmacHex, sameSignature } from "./sign";
import type { PaymentProvider, ProviderEvent } from "./types";

const HEADER = "fake-signature";

export type FakeProvider = PaymentProvider & {
  /** Signs an event the way the fake checkout page sends it. */
  signedEvent(event: ProviderEvent): { body: string; headers: Headers };
};

/**
 * The stand-in provider (PAY-06): a checkout page at /dev/pay/[id] whose Pay
 * and Fail buttons send signed webhooks, so every flow runs with no outside
 * account. providerFor() keeps it off production domains.
 */
export function fakeProvider(secret: string): FakeProvider {
  const site = () =>
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    name: "fake",
    async createCheckout() {
      const checkoutId = `fake_cs_${randomUUID()}`;
      return { checkoutId, checkoutUrl: `${site()}/dev/pay/${checkoutId}` };
    },
    async expireCheckout() {},
    async refund() {
      return { refundId: `fake_ref_${randomUUID()}` };
    },
    verifyWebhook(rawBody, headers) {
      const signature = headers.get(HEADER);
      return !!signature && sameSignature(signature, hmacHex(secret, rawBody));
    },
    parseEvent(rawBody) {
      const event = JSON.parse(rawBody) as ProviderEvent;
      return {
        id: event.id,
        type: event.type,
        checkoutId: event.checkoutId,
        paymentId: event.paymentId,
      };
    },
    signedEvent(event) {
      const body = JSON.stringify(event);
      return {
        body,
        headers: new Headers({ [HEADER]: hmacHex(secret, body) }),
      };
    },
  };
}
