import type { OrderStatus } from "@/generated/prisma/enums";
import { now } from "@/lib/clock";
import { db } from "@/lib/db";
import {
  getOrderingDay,
  orderingState,
  type OrderingState,
  type PickupWindow,
} from "@/modules/cafe";
import { getCart, type CartOwner, type CartView } from "@/modules/cart";
import { balance, STARS_PER_REWARD } from "@/modules/loyalty";

import { expireUnpaid } from "./bar";
import { orderLink, tokenMatches } from "./links";
import { baseOf, rewardLineOf } from "./place";
import { GUEST_PAY_AT_PICKUP_MAX_DRINKS } from "./rules";
import { offeredWindows } from "./windows";

export type CheckoutView = {
  state: OrderingState;
  cart: CartView;
  prepMinutes: number;
  windows: PickupWindow[];
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
  const day = await getOrderingDay(at);
  const empty: CartView = {
    lines: [],
    totalCents: 0,
    drinks: 0,
    foodLines: 0,
    blocked: false,
  };
  const cart = owner ? await getCart(owner) : empty;
  const { prepMinutes, windows } = await offeredWindows(db, at, day, {
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
    prepMinutes,
    windows,
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
    version: `${order.status}:${order.updatedAt.getTime()}`,
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

/** A day's Orders and totals for the Manager (STAFF-07). */
export async function dayOrders(day: string) {
  const orders = await db.order.findMany({
    where: { serviceDay: new Date(`${day}T00:00:00Z`) },
    orderBy: { placedAt: "asc" },
    include: { payment: { select: { status: true } } },
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
      refundable:
        o.status === "picked_up" ||
        (o.status === "cancelled" && o.paidAt !== null),
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
    summary: order.lines.map((l) => `${l.quantity} x ${l.name}`).join(", "),
    link: orderLink(order.id).replace(/^https?:\/\/[^/]+/, ""),
  }));
}
