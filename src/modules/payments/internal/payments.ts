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
 * nothing (ADR 0003). A paid event marks its pending Payment paid.
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
  const payment = await tx.payment.findFirst({
    where: {
      provider,
      providerCheckoutId: event.checkoutId,
      status: "pending",
    },
  });
  if (!payment) return { kind: "ignored" };
  if (event.type === "failed") {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return { kind: "failed" };
  }
  await tx.payment.update({
    where: { id: payment.id },
    data: { status: "paid", providerPaymentId: event.paymentId },
  });
  return { kind: "paid", orderId: payment.orderId };
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
 * An Order expired unpaid: close its checkout at the provider and mark the
 * Payment expired, so a late payment is not taken (ADR 0003).
 */
export async function closeCheckout(orderId: string): Promise<void> {
  const payment = await db.payment.findUnique({ where: { orderId } });
  if (!payment || payment.status !== "pending") return;
  await db.payment.update({
    where: { id: payment.id },
    data: { status: "expired" },
  });
  try {
    await paymentProvider().expireCheckout(payment.providerCheckoutId);
  } catch (error) {
    console.error("[payments] checkout not expired at the provider:", error);
  }
}
