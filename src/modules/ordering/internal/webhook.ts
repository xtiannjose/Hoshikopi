import { db } from "@/lib/db";
import {
  recordPaymentEvent,
  refundPayment,
  verifyWebhookEvent,
} from "@/modules/payments";

import { emailOrderPlaced } from "./emails";
import { transition } from "./status";

export type WebhookResponse = {
  status: 200 | 401 | 404;
  result:
    | "paid"
    | "refunded_late"
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
 * transaction. The Order placed email follows the commit. A payment that
 * lands after its Order Expired or was Cancelled is refunded in full.
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
    if (!moved.ok) {
      return { result: "paid_late" as const, lateOrderId: recorded.orderId };
    }
    return { result: "paid" as const, orderId: recorded.orderId };
  });
  if ("orderId" in outcome && outcome.orderId) {
    await emailOrderPlaced(outcome.orderId);
  }
  if ("lateOrderId" in outcome && outcome.lateOrderId) {
    // The provider call runs after the commit, outside the transaction.
    try {
      await refundPayment(outcome.lateOrderId, "webhook");
      return { status: 200, result: "refunded_late" };
    } catch (error) {
      console.error(
        `[payments] paid after the Order closed, refund by hand: ${outcome.lateOrderId}`,
        error
      );
    }
  }
  return { status: 200, result: outcome.result };
}
