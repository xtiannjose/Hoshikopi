import { db } from "@/lib/db";
import { closeCheckout, refundPayment } from "@/modules/payments";

import { emailOrderRefunded } from "./emails";
import { transition, type Actor } from "./status";

export type RefundResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_allowed" | "provider_failed" };

/**
 * A full Refund (PAY-05): the online Payment is refunded through the
 * provider first (Pay at Pickup is refunded in cash at the counter), then
 * the Order moves to Refunded and the Customer gets an email. Managers
 * refund; the system refunds a paid Order its Customer cancelled (ORD-09).
 */
export async function refundOrder(
  orderId: string,
  actor: Actor
): Promise<RefundResult> {
  const manager = actor.kind === "staff" && actor.role === "manager";
  if (!manager && actor.kind !== "system") {
    return { ok: false, reason: "not_allowed" };
  }
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, reason: "not_found" };
  const eligible =
    (order.status === "picked_up" && manager) ||
    (order.status === "cancelled" && order.paidAt !== null);
  if (!eligible) return { ok: false, reason: "not_allowed" };

  let outcome;
  try {
    outcome = await refundPayment(
      orderId,
      actor.kind === "staff" ? actor.id : "system"
    );
  } catch (error) {
    console.error("[payments] refund refused by the provider:", error);
    return { ok: false, reason: "provider_failed" };
  }
  // Someone else is refunding this Order right now.
  if (outcome === "already_refunded") {
    return { ok: false, reason: "not_allowed" };
  }
  const moved = await transition(orderId, "refunded", actor);
  if (!moved.ok) return { ok: false, reason: "not_allowed" };
  await emailOrderRefunded(orderId);
  return { ok: true };
}

/**
 * Cancel an Order; a paid one goes on to a full Refund (docs/03 section 7).
 * Staff refund as themselves, a Customer's cancel is refunded by the system.
 * An unpaid one has its checkout closed, so it cannot be paid afterwards.
 */
export async function cancelOrder(
  orderId: string,
  actor: Actor,
  reason?: string
) {
  const result = await transition(orderId, "cancelled", actor, reason);
  if (result.ok && result.order.paidAt) {
    await refundOrder(
      orderId,
      actor.kind === "staff" ? actor : { kind: "system" }
    );
  } else if (result.ok) {
    await closeCheckout(orderId);
  }
  return result;
}
