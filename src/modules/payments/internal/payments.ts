import { randomUUID } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { db, type Client } from "@/lib/db";

import { paymentProvider } from "./provider";
import type { OnlineMethod, ProviderEvent } from "./types";

/** Create a pending Payment and the provider's hosted checkout (PAY-01). */
export async function startPayment(input: {
  orderId: string;
  orderCode: string;
  amountCents: number;
  method: OnlineMethod;
  returnUrl: string;
}): Promise<{ checkoutUrl: string }> {
  const provider = paymentProvider();
  const id = randomUUID();
  const checkout = await provider.createCheckout({
    paymentId: id,
    orderCode: input.orderCode,
    amountCents: input.amountCents,
    method: input.method,
    returnUrl: input.returnUrl,
  });
  await db.payment.create({
    data: {
      id,
      orderId: input.orderId,
      provider: provider.name,
      providerCheckoutId: checkout.checkoutId,
      checkoutUrl: checkout.checkoutUrl,
      method: input.method,
      amountCents: input.amountCents,
      status: "pending",
    },
  });
  return { checkoutUrl: checkout.checkoutUrl };
}

export type VerifiedEvent =
  | { ok: true; provider: string; event: ProviderEvent }
  | {
      ok: false;
      status: 401 | 404;
      result: "bad_signature" | "wrong_provider";
    };

/** Check the webhook came from this server's provider, unchanged (PAY-03). */
export function verifyWebhookEvent(
  routeProvider: string,
  rawBody: string,
  headers: Headers
): VerifiedEvent {
  const provider = paymentProvider();
  if (provider.name !== routeProvider) {
    return { ok: false, status: 404, result: "wrong_provider" };
  }
  if (!provider.verifyWebhook(rawBody, headers)) {
    return { ok: false, status: 401, result: "bad_signature" };
  }
  return {
    ok: true,
    provider: provider.name,
    event: provider.parseEvent(rawBody),
  };
}

export type RecordedEvent =
  | { kind: "duplicate" }
  | { kind: "paid"; orderId: string }
  | { kind: "failed" }
  | { kind: "ignored" };

/**
 * Store the event once under (provider, provider_event_id); a repeat changes
 * nothing (ADR 0003). A paid event marks its Payment paid, even after a
 * failed attempt or after the Order expired: the money was taken, so the
 * caller pays the Order or refunds it, never drops it.
 */
export async function recordPaymentEvent(
  tx: Prisma.TransactionClient,
  provider: string,
  event: ProviderEvent,
  rawBody: string
): Promise<RecordedEvent> {
  const inserted = await tx.$queryRaw<{ id: string }[]>`
    INSERT INTO payment_events (id, provider, provider_event_id, type, payload)
    VALUES (${randomUUID()}, ${provider}, ${event.id}, ${event.type}, ${rawBody}::jsonb)
    ON CONFLICT (provider, provider_event_id) DO NOTHING
    RETURNING id`;
  if (inserted.length === 0) return { kind: "duplicate" };
  if (!event.checkoutId || event.type === "other") return { kind: "ignored" };
  // Locked, so two events for one checkout decide one at a time.
  const [payment] = await tx.$queryRaw<
    { id: string; status: string; order_id: string }[]
  >`
    SELECT id, status::text AS status, order_id FROM payments
    WHERE provider = ${provider} AND provider_checkout_id = ${event.checkoutId}
    FOR UPDATE`;
  if (!payment) return { kind: "ignored" };
  if (event.type === "failed") {
    if (payment.status !== "pending") return { kind: "ignored" };
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return { kind: "failed" };
  }
  if (payment.status === "paid" || payment.status === "refunded") {
    return { kind: "ignored" };
  }
  await tx.payment.update({
    where: { id: payment.id },
    data: { status: "paid", providerPaymentId: event.paymentId },
  });
  return { kind: "paid", orderId: payment.order_id };
}

/** The online Payment of an Order, if any. */
export async function paymentForOrder(orderId: string, client: Client = db) {
  return client.payment.findUnique({ where: { orderId } });
}

/** What the fake checkout page shows (PAY-06). */
export async function paymentByCheckout(checkoutId: string) {
  return db.payment.findFirst({ where: { providerCheckoutId: checkoutId } });
}

/**
 * An Order expired or was cancelled unpaid: close its checkout at the
 * provider, then mark the Payment expired (ADR 0003). A checkout with a
 * payment going through refuses to close; the Payment stays open, and if the
 * payment lands the webhook refunds it.
 */
export async function closeCheckout(orderId: string): Promise<void> {
  const payment = await db.payment.findUnique({ where: { orderId } });
  if (!payment || !["pending", "failed"].includes(payment.status)) return;
  try {
    await paymentProvider().expireCheckout(payment.providerCheckoutId);
  } catch (error) {
    console.error("[payments] checkout not expired at the provider:", error);
    return;
  }
  // Only if no webhook paid it meanwhile.
  await db.payment.updateMany({
    where: { id: payment.id, status: { in: ["pending", "failed"] } },
    data: { status: "expired" },
  });
}

export type RefundOutcome =
  "no_online_payment" | "refunded" | "already_refunded";

/**
 * Refund an Order's online Payment in full (PAY-05). The Payment is claimed
 * paid -> refunded first, so two refunds at once cannot both reach the
 * provider; the claim is undone if the provider refuses.
 */
export async function refundPayment(
  orderId: string,
  actorId: string
): Promise<RefundOutcome> {
  const payment = await db.payment.findUnique({ where: { orderId } });
  if (!payment) return "no_online_payment";
  const claimed = await db.payment.updateMany({
    where: { id: payment.id, status: "paid" },
    data: { status: "refunded" },
  });
  if (claimed.count === 0) {
    return payment.status === "refunded"
      ? "already_refunded"
      : "no_online_payment";
  }
  try {
    const { refundId } = await paymentProvider().refund(
      payment.providerPaymentId ?? "",
      payment.amountCents
    );
    await db.refund.create({
      data: {
        paymentId: payment.id,
        providerRefundId: refundId,
        amountCents: payment.amountCents,
        reason: "Full refund",
        actorId,
      },
    });
  } catch (error) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "paid" },
    });
    throw error;
  }
  return "refunded";
}
