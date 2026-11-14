import type { OrderStatus } from "@/generated/prisma/enums";
import { now } from "@/lib/clock";
import { db } from "@/lib/db";
import {
  orderingState,
  type OrderingState,
  type PickupWindow,
} from "@/modules/cafe";
import { getCart, type CartOwner, type CartView } from "@/modules/cart";
import { balance, STARS_PER_REWARD } from "@/modules/loyalty";

import { expireUnpaid } from "./bar";
import { orderingDay } from "./day";
import { orderLink, tokenMatches } from "./links";
import { baseOf, rewardLineOf } from "./place";
import { customerVersion, drinksAhead } from "./queue";
import { GUEST_PAY_AT_PICKUP_MAX_DRINKS, orderLimit } from "./rules";
import { offeredWindows } from "./windows";

export type CheckoutView = {
  state: OrderingState;
  cart: CartView;
  /** Busy Mode is on: Prep Time and the windows are longer than usual. */
  busy: boolean;
  windows: PickupWindow[];
  /** The most one Order holds today: one Pickup Window (audit journeys:3). */
  limit: { drinks: number; food: number };
  /** Guests may Pay at Pickup for up to 4 drinks (PAY-02). */
  payAtPickupAllowed: boolean;
  /** A Member with 9 Stars may make one drink free (LOY-03). */
  reward: { name: string; discountCents: number } | null;
};

/** What checkout offers this browser right now (ORD-03, ORD-04, ORD-07). */
export async function checkoutView(
  owner: CartOwner | null,
  memberId: string | null
): Promise<CheckoutView> {
  const at = now();
  // Unpaid online Orders give their windows back before we list them.
  await expireUnpaid(at);
  const day = await orderingDay(at);
  const empty: CartView = {
    lines: [],
    totalCents: 0,
    drinks: 0,
    foodLines: 0,
    blocked: false,
  };
  const cart = owner ? await getCart(owner) : empty;
  const { windows } = await offeredWindows(db, at, day, {
    drinks: cart.drinks,
    food: cart.foodLines,
  });
  const rewardLine = rewardLineOf(cart);
  const reward =
    memberId && rewardLine && (await balance(memberId)) >= STARS_PER_REWARD
      ? { name: rewardLine.name, discountCents: baseOf(rewardLine) }
      : null;
  return {
    state: orderingState(at, day),
    cart,
    busy: day.busy !== null,
    windows,
    limit: orderLimit(day.capacity),
    reward,
    payAtPickupAllowed:
      memberId !== null || cart.drinks <= GUEST_PAY_AT_PICKUP_MAX_DRINKS,
  };
}

export type OrderView = {
  id: string;
  code: string;
  status: OrderStatus;
  customerName: string;
  pickupKind: "asap" | "scheduled";
  windowStart: Date;
  paymentMethod: string;
  totalCents: number;
  placedAt: Date;
  paidAt: Date | null;
  acceptedAt: Date | null;
  readyAt: Date | null;
  pickedUpAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  /** Changes whenever the Order does; the page polls for it (ADR 0009). */
  version: string;
  /** Drinks the bar makes first, while an As Soon As Possible Order waits. */
  drinksAhead: number | null;
  /** Guests are offered an account to keep Stars (ORD-05). */
  isMember: boolean;
  /** The online Payment, if any: pending shows "Finish paying". */
  payment: { status: string; checkoutUrl: string } | null;
  lines: {
    name: string;
    options: { group: string; name: string; deltaCents: number }[];
    quantity: number;
    lineCents: number;
    note: string | null;
    isReward: boolean;
  }[];
};

/** An Order for its Customer: the link token must match (docs/03 section 4). */
export async function getOrderForCustomer(
  id: string,
  token: string
): Promise<OrderView | null> {
  await expireUnpaid(now());
  const order = await db.order.findUnique({
    where: { id },
    include: { lines: { orderBy: { createdAt: "asc" } }, payment: true },
  });
  if (!order || !token || !tokenMatches(token, order.accessTokenHash)) {
    return null;
  }
  const ahead = await drinksAhead(order);
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    customerName: order.customerName,
    pickupKind: order.pickupKind,
    windowStart: order.windowStart,
    paymentMethod: order.paymentMethod,
    totalCents: order.totalCents,
    placedAt: order.placedAt,
    paidAt: order.paidAt,
    acceptedAt: order.acceptedAt,
    readyAt: order.readyAt,
    pickedUpAt: order.pickedUpAt,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    version: customerVersion(order, ahead),
    drinksAhead: ahead,
    isMember: order.memberId !== null,
    payment: order.payment
      ? { status: order.payment.status, checkoutUrl: order.payment.checkoutUrl }
      : null,
    lines: order.lines.map((line) => ({
      name: line.name,
      options: line.options as OrderView["lines"][number]["options"],
      quantity: line.quantity,
      lineCents: line.lineCents,
      note: line.note,
      isReward: line.isReward,
    })),
  };
}

/** The Order Code and total, for the fake checkout page (PAY-06). */
export async function getOrderBrief(id: string) {
  return db.order.findUnique({
    where: { id },
    select: { code: true, totalCents: true },
  });
}

/** "2 x Hoshi Latte, 1 x Ensaymada" and the status page path, without the
 * site's origin, for staff and Member lists. */
function summaryAndLink(order: {
  id: string;
  lines: { name: string; quantity: number }[];
}) {
  return {
    summary: order.lines.map((l) => `${l.quantity} x ${l.name}`).join(", "),
    link: orderLink(order.id).replace(/^https?:\/\/[^/]+/, ""),
  };
}

/**
 * Money still held for an Order that is over: paid after it Expired or was
 * Cancelled, or its automatic Refund failed. A Manager refunds it by hand.
 */
const closedButPaid = (o: {
  status: string;
  payment: { status: string } | null;
}) =>
  (o.status === "expired" || o.status === "cancelled") &&
  o.payment?.status === "paid";

/**
 * Every Order that still needs a Refund, any day, for the top of
 * /manage/orders: the only place this used to show was a log line that
 * Vercel keeps for an hour (audit ops:1).
 */
export async function ordersToRefund() {
  return db.order.findMany({
    where: {
      status: { in: ["expired", "cancelled"] },
      payment: { status: "paid" },
    },
    orderBy: { placedAt: "asc" },
    select: {
      id: true,
      code: true,
      status: true,
      serviceDay: true,
      totalCents: true,
    },
  });
}

/** A day's Orders and totals for the Manager (STAFF-07). */
export async function dayOrders(day: string) {
  const orders = await db.order.findMany({
    where: { serviceDay: new Date(`${day}T00:00:00Z`) },
    orderBy: { placedAt: "asc" },
    include: {
      payment: { select: { status: true } },
      lines: {
        select: { name: true, quantity: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  const counted = orders.filter(
    (o) => !["cancelled", "expired", "refunded"].includes(o.status)
  );
  return {
    orders: orders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      customerName: o.customerName,
      placedAt: o.placedAt,
      windowStart: o.windowStart,
      paymentMethod: o.paymentMethod,
      totalCents: o.totalCents,
      paid: o.paidAt !== null,
      ...summaryAndLink(o),
      // A free Order (a Reward covered it) has nothing to give back.
      refundable:
        (o.status === "picked_up" && o.totalCents > 0) ||
        (o.status === "cancelled" && o.paidAt !== null) ||
        closedButPaid(o),
      cancellable: [
        "placed",
        "paid",
        "accepted",
        "preparing",
        "ready",
      ].includes(o.status),
    })),
    count: counted.length,
    totalCents: counted.reduce((sum, o) => sum + o.totalCents, 0),
  };
}

/** A Member's Orders, newest first, with their status links (ACC-02). */
export async function ordersForMember(memberId: string, take = 20) {
  const orders = await db.order.findMany({
    where: { memberId },
    orderBy: { placedAt: "desc" },
    take,
    include: { lines: { select: { name: true, quantity: true } } },
  });
  return orders.map((order) => ({
    id: order.id,
    code: order.code,
    status: order.status,
    placedAt: order.placedAt,
    totalCents: order.totalCents,
    ...summaryAndLink(order),
  }));
}

/** A Member's Orders for their data export (ACC-03). */
export async function ordersForExport(memberId: string) {
  const orders = await db.order.findMany({
    where: { memberId },
    orderBy: { placedAt: "asc" },
    include: { lines: { orderBy: { createdAt: "asc" } } },
  });
  return orders.map((order) => ({
    code: order.code,
    placedAt: order.placedAt,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalCents: order.totalCents,
    lines: order.lines.map((line) => ({
      name: line.name,
      quantity: line.quantity,
      lineCents: line.lineCents,
      options: (line.options as { name: string }[]).map((o) => o.name),
    })),
  }));
}

/**
 * Deleting an account keeps its Orders for the cafe's records but without
 * the person: no Member link, name, phone or real email (ACC-03, docs/03
 * section 13). The email column needs a value, so it gets a placeholder.
 */
export async function deidentifyOrders(memberId: string) {
  await db.order.updateMany({
    where: { memberId },
    data: {
      memberId: null,
      customerName: "Deleted customer",
      customerEmail: "deleted@hoshikopi.invalid",
      customerPhone: null,
    },
  });
}
