import { db } from "@/lib/db";
import {
  sendOrderPlaced,
  sendOrderReady,
  type OrderForEmail,
} from "@/modules/notify";

import { orderLink } from "./links";

async function orderForEmail(orderId: string): Promise<OrderForEmail | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { lines: { orderBy: { createdAt: "asc" } } },
  });
  if (!order?.customerEmail) return null;
  return {
    code: order.code,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    pickupKind: order.pickupKind,
    windowStart: order.windowStart,
    paymentMethod: order.paymentMethod,
    totalCents: order.totalCents,
    lines: order.lines.map((line) => ({
      name: line.name,
      options: (line.options as { name: string }[]).map((o) => o.name),
      quantity: line.quantity,
      lineCents: line.lineCents,
    })),
  };
}

/**
 * Emails go out after the transaction commits; a failed email is logged
 * and never undoes the Order (ORD-10).
 */
async function attempt(what: string, run: () => Promise<void>) {
  try {
    await run();
  } catch (error) {
    console.error(`[email] ${what} not sent:`, error);
  }
}

export async function emailOrderPlaced(orderId: string) {
  await attempt("order placed", async () => {
    const order = await orderForEmail(orderId);
    if (order) await sendOrderPlaced(order, orderLink(orderId));
  });
}

export async function emailOrderReady(orderId: string) {
  await attempt("order ready", async () => {
    const order = await orderForEmail(orderId);
    if (order) await sendOrderReady(order);
  });
}
