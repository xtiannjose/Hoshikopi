import type { Order, OrderStatus, Prisma } from "@/generated/prisma/client";
import { dayValue, now } from "@/lib/clock";
import { db, inTransaction, type Client } from "@/lib/db";

import { emailOrderPlaced, emailOrderReady } from "./emails";

// The Order Status machine (docs/03-ARCHITECTURE.md section 7). Order
// Status changes only here; anything else is a bug (CLAUDE.md).

export type Actor =
  | { kind: "customer"; id?: string }
  | { kind: "webhook" }
  | { kind: "system" }
  | { kind: "staff"; id: string; role: "barista" | "manager" };

export type TransitionResult =
  | { ok: true; order: Order; from: OrderStatus }
  | {
      ok: false;
      reason: "not_found" | "not_allowed" | "reason_required";
      status?: OrderStatus;
    };

const ONLINE = (order: Order) => order.paymentMethod !== "pay_at_pickup";
const isStaff = (actor: Actor) => actor.kind === "staff";
const isManager = (actor: Actor) =>
  actor.kind === "staff" && actor.role === "manager";

/** Who may move an Order from which Order Status to `to`. */
function allowed(order: Order, to: OrderStatus, actor: Actor): boolean {
  const from = order.status;
  switch (to) {
    case "paid":
      return from === "placed" && ONLINE(order) && actor.kind === "webhook";
    case "expired":
      return from === "placed" && ONLINE(order) && actor.kind === "system";
    case "accepted":
      return (
        isStaff(actor) &&
        ((from === "placed" && !ONLINE(order)) || from === "paid")
      );
    case "preparing":
      return isStaff(actor) && from === "accepted";
    case "ready":
      return isStaff(actor) && from === "preparing";
    case "picked_up":
      return isStaff(actor) && from === "ready";
    case "cancelled":
      if (actor.kind === "customer")
        return from === "placed" || from === "paid";
      return (
        isManager(actor) &&
        ["placed", "paid", "accepted", "preparing", "ready"].includes(from)
      );
    case "refunded":
      // The system refunds a paid Order its Customer cancelled (ORD-09).
      return (
        (isManager(actor) && from === "picked_up") ||
        ((isManager(actor) || actor.kind === "system") &&
          from === "cancelled" &&
          order.paidAt !== null)
      );
    default:
      return false;
  }
}

/** Timestamps and flags each Order Status sets. */
function changes(order: Order, to: OrderStatus, reason?: string) {
  const at = now();
  const data: Prisma.OrderUpdateInput = { status: to };
  if (to === "paid") data.paidAt = at;
  if (to === "accepted") data.acceptedAt = at;
  if (to === "ready") data.readyAt = at;
  if (to === "picked_up") {
    data.pickedUpAt = at;
    // Pay at Pickup is paid at the counter when the Customer collects.
    if (!ONLINE(order)) {
      data.paidAtCounter = true;
      data.paidAt = at;
    }
  }
  if (to === "cancelled") {
    data.cancelledAt = at;
    data.cancelReason = reason ?? null;
  }
  return data;
}

/** Give back this Order's drinks and food Lines to its Pickup Window. */
async function releaseWindow(tx: Prisma.TransactionClient, order: Order) {
  const lines = await tx.orderLine.findMany({ where: { orderId: order.id } });
  const drinks = lines
    .filter((line) => line.isDrink)
    .reduce((sum, line) => sum + line.quantity, 0);
  const food = lines.filter((line) => !line.isDrink).length;
  await tx.pickupWindowUsage.updateMany({
    where: { windowStart: order.windowStart },
    data: { drinks: { decrement: drinks }, food: { decrement: food } },
  });
}

/**
 * Move an Order to `to` if the table allows this actor to: locks the Order
 * row, applies the side effects in the same transaction and appends an
 * order_events row. Cancelled and Expired Orders give back their Pickup
 * Window counts (ADR 0007).
 */
export async function transition(
  orderId: string,
  to: OrderStatus,
  actor: Actor,
  reason?: string,
  client: Client = db
): Promise<TransitionResult> {
  const result = await move(orderId, to, actor, reason, client);
  // Emails after commit; a caller's own transaction sends them itself.
  if (result.ok && client === db) {
    if (to === "ready") await emailOrderReady(orderId);
    if (to === "paid") await emailOrderPlaced(orderId);
  }
  return result;
}

function move(
  orderId: string,
  to: OrderStatus,
  actor: Actor,
  reason: string | undefined,
  client: Client
): Promise<TransitionResult> {
  return inTransaction(client, async (tx) => {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) return { ok: false, reason: "not_found" };
    if (!allowed(order, to, actor)) {
      return { ok: false, reason: "not_allowed", status: order.status };
    }
    const why = reason?.trim();
    if (to === "cancelled" && actor.kind === "staff" && !why) {
      return { ok: false, reason: "reason_required", status: order.status };
    }
    const updated = await tx.order.update({
      where: { id: order.id },
      data: changes(order, to, why),
    });
    if (to === "cancelled" || to === "expired") await releaseWindow(tx, order);
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: to,
        actorKind: actor.kind,
        actorId: "id" in actor ? actor.id : null,
        reason: why || null,
      },
    });
    return { ok: true, order: updated, from: order.status };
  });
}

/** The next Order Code for a Manila service day: K-001, K-002, ... */
export async function nextOrderCode(
  serviceDay: string,
  prefix: string,
  client: Client = db
): Promise<string> {
  const [row] = await client.$queryRaw<{ last_number: number }[]>`
    INSERT INTO order_code_counters (service_day, last_number)
    VALUES (${dayValue(serviceDay)}::date, 1)
    ON CONFLICT (service_day)
    DO UPDATE SET last_number = order_code_counters.last_number + 1
    RETURNING last_number`;
  return `${prefix}-${String(row.last_number).padStart(3, "0")}`;
}
