import { db } from "@/lib/db";
import { recordPaymentEvent, verifyWebhookEvent } from "@/modules/payments";

import { emailOrderPlaced } from "./emails";
import { transition } from "./status";

export type WebhookResponse = {
  status: 200 | 401 | 404;
  result:
    | "paid"
    | "paid_late"
    | "duplicate"
    | "failed"
    | "ignored"
    | "bad_signature"
    | "wrong_provider";
};

/**
 * A payment provider's webhook (PAY-03, ADR 0003): verify the signature,
 * store the event once, and only then move the Order to Paid, in one
 * transaction. The Order placed email follows the commit.
 */
export async function receivePaymentWebhook(
  routeProvider: string,
  rawBody: string,
  headers: Headers
): Promise<WebhookResponse> {
  const verified = verifyWebhookEvent(routeProvider, rawBody, headers);
  if (!verified.ok) return { status: verified.status, result: verified.result };
  const outcome = await db.$transaction(async (tx) => {
    const recorded = await recordPaymentEvent(
      tx,
      verified.provider,
      verified.event,
      rawBody
    );
    if (recorded.kind !== "paid") return { result: recorded.kind };
    const moved = await transition(
      recorded.orderId,
      "paid",
      { kind: "webhook" },
      undefined,
      tx
    );
    // shortcut: a payment that lands after its Order Expired is logged for
    // a Manager to refund by hand; automate the refund if it happens.
    if (!moved.ok) {
      console.error(
        `[payments] paid after the Order closed: ${recorded.orderId}`
      );
      return { result: "paid_late" as const };
    }
    return { result: "paid" as const, orderId: recorded.orderId };
  });
  if ("orderId" in outcome && outcome.orderId) {
    await emailOrderPlaced(outcome.orderId);
  }
  return { status: 200, result: outcome.result };
}
