import type { OrderStatus } from "@/generated/prisma/enums";
import { now } from "@/lib/clock";
import { isPlainText } from "@/lib/text";
import { db } from "@/lib/db";
import { closeCheckout } from "@/modules/payments";

import { expireIfUnpaid } from "./bar";
import { tokenMatches } from "./links";
import { customerVersion, drinksAhead } from "./queue";
import { cancelOrder } from "./refund";
import { transition, type TransitionResult } from "./status";

async function orderWithToken(id: string, token: string) {
  // No Order id has a NUL; Postgres would refuse it (audit SEC2-10).
  if (!isPlainText(id)) return null;
  const order = await db.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      pickupKind: true,
      serviceDay: true,
      windowStart: true,
      placedAt: true,
      updatedAt: true,
      accessTokenHash: true,
    },
  });
  return order && token && tokenMatches(token, order.accessTokenHash)
    ? order
    : null;
}

/** The Customer cancels with their link, until the bar accepts (ORD-09). */
export async function cancelByCustomer(
  id: string,
  token: string
): Promise<TransitionResult> {
  const order = await orderWithToken(id, token);
  if (!order) return { ok: false, reason: "not_found" };
  // A paid Order goes on to a full Refund (ORD-09).
  return cancelOrder(order.id, { kind: "customer" });
}

/**
 * A small answer for the status page's polling (ADR 0009). An Order unpaid
 * past its 15 minutes Expires here, so the page refreshes to say so even
 * when nothing else sweeps (audit PERF-16, ORD-19).
 */
export async function orderVersion(
  id: string,
  token: string
): Promise<{ status: OrderStatus; version: string } | null> {
  let order = await orderWithToken(id, token);
  if (order && (await expireIfUnpaid(order.id, now()))) {
    await closeCheckout(order.id);
    order = await orderWithToken(id, token);
  }
  return order
    ? {
        status: order.status,
        version: customerVersion(order, await drinksAhead(order)),
      }
    : null;
}

/** The bar's next step from each Order Status (the Bar Screen's one tap). */
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "accepted",
  paid: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "picked_up",
};

/**
 * Demo Mode (ADR 0015): the visitor plays the barista on their own Order,
 * one step at a time, with its link. The Order Status table still decides;
 * an unpaid online Order waits for its checkout.
 */
export async function advanceInDemo(
  id: string,
  token: string,
  /** The Order Status the button was drawn for: a repeat tap finds it moved. */
  from: OrderStatus
): Promise<TransitionResult> {
  const order = await orderWithToken(id, token);
  if (!order) return { ok: false, reason: "not_found" };
  const next = NEXT[from];
  if (!next || order.status !== from) {
    return { ok: false, reason: "not_allowed", status: order.status };
  }
  // transition() re-checks under the row lock, so two taps at once move once.
  return transition(order.id, next, { kind: "demo" });
}
