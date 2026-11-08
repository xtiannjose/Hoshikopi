import type { OrderStatus, PickupKind } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

type Place = {
  id: string;
  status: OrderStatus;
  pickupKind: PickupKind;
  serviceDay: Date;
  windowStart: Date;
  placedAt: Date;
  updatedAt: Date;
};

/** Before the bar starts on it; Preparing has its own message. */
const WAITING: OrderStatus[] = ["placed", "paid", "accepted"];

/**
 * Drinks the bar makes before this As Soon As Possible Order, in Bar Screen
 * order (Pickup Time, then placing time), while it waits (FEAT-03). Null for
 * a Scheduled Pickup (made near its time) or once the bar is on it.
 */
export async function drinksAhead(order: Place): Promise<number | null> {
  if (order.pickupKind !== "asap" || !WAITING.includes(order.status)) {
    return null;
  }
  const sum = await db.orderLine.aggregate({
    _sum: { quantity: true },
    where: {
      isDrink: true,
      order: {
        serviceDay: order.serviceDay,
        id: { not: order.id },
        AND: [
          // On the Bar Screen and not made yet.
          {
            OR: [
              { status: { in: ["paid", "accepted", "preparing"] } },
              { status: "placed", paymentMethod: "pay_at_pickup" },
            ],
          },
          {
            OR: [
              { windowStart: { lt: order.windowStart } },
              {
                windowStart: order.windowStart,
                placedAt: { lt: order.placedAt },
              },
            ],
          },
        ],
      },
    },
  });
  return sum._sum.quantity ?? 0;
}

/**
 * What the Order page compares while polling (ADR 0009): it changes with the
 * Order and with the drinks ahead of it.
 */
export const customerVersion = (order: Place, ahead: number | null) =>
  `${order.status}:${order.updatedAt.getTime()}:${ahead ?? "-"}`;
