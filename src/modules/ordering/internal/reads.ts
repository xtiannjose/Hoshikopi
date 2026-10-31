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

import { tokenMatches } from "./place";
import { GUEST_PAY_AT_PICKUP_MAX_DRINKS } from "./rules";
import { offeredWindows } from "./windows";

export type CheckoutView = {
  state: OrderingState;
  cart: CartView;
  prepMinutes: number;
  windows: PickupWindow[];
  /** Guests may Pay at Pickup for up to 4 drinks (PAY-02). */
  payAtPickupAllowed: boolean;
};

/** What checkout offers this browser right now (ORD-03, ORD-04, ORD-07). */
export async function checkoutView(
  owner: CartOwner | null,
  memberId: string | null
): Promise<CheckoutView> {
  const at = now();
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
  return {
    state: orderingState(at, day),
    cart,
    prepMinutes,
    windows,
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
  const order = await db.order.findUnique({
    where: { id },
    include: { lines: { orderBy: { createdAt: "asc" } } },
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
    lines: order.lines.map((line) => ({
      name: line.name,
      options: line.options as OrderView["lines"][number]["options"],
      quantity: line.quantity,
      lineCents: line.lineCents,
      note: line.note,
    })),
  };
}
