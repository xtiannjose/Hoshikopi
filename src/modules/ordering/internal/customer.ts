import type { OrderStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

import { tokenMatches } from "./links";
import { cancelOrder } from "./refund";
import type { TransitionResult } from "./status";

async function orderWithToken(id: string, token: string) {
  const order = await db.order.findUnique({
    where: { id },
    select: { id: true, status: true, updatedAt: true, accessTokenHash: true },
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
        version: `${order.status}:${order.updatedAt.getTime()}`,
      }
    : null;
}
