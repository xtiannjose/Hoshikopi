import type { OrderStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

import { tokenMatches } from "./links";
import { customerVersion, drinksAhead } from "./queue";
import { cancelOrder } from "./refund";
import { transition, type TransitionResult } from "./status";

async function orderWithToken(id: string, token: string) {
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

/** A small answer for the status page's polling (ADR 0009). */
export async function orderVersion(
  id: string,
  token: string
): Promise<{ status: OrderStatus; version: string } | null> {
  const order = await orderWithToken(id, token);
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
  token: string
): Promise<TransitionResult> {
  const order = await orderWithToken(id, token);
  if (!order) return { ok: false, reason: "not_found" };
  const next = NEXT[order.status];
  if (!next) return { ok: false, reason: "not_allowed", status: order.status };
  return transition(order.id, next, { kind: "demo" });
}
