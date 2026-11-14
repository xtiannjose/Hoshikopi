import type { Prisma } from "@/generated/prisma/client";
import { dayValue } from "@/lib/clock";
import type { Client } from "@/lib/db";
import {
  pickupWindows,
  prepMinutes,
  type Counts,
  type OrderingDay,
  type PickupWindow,
} from "@/modules/cafe";

/**
 * Orders on the Bar Screen and not made yet: Paid, Accepted, Preparing,
 * and Placed Pay at Pickup (an unpaid online Order may never come).
 */
export const ON_BAR: Prisma.OrderWhereInput = {
  OR: [
    { status: { in: ["paid", "accepted", "preparing"] } },
    { status: "placed", paymentMethod: "pay_at_pickup" },
  ],
};

/**
 * Drinks the bar makes before a new As Soon As Possible Order, for Prep
 * Time (ADR 0007): those it is making (Accepted, Preparing) and the ASAP
 * Orders waiting on the Bar Screen. A Scheduled Order still waiting is
 * made near its own time, so it does not hold up ASAP ones.
 */
export async function drinksQueuedAhead(client: Client, serviceDay: string) {
  const sum = await client.orderLine.aggregate({
    _sum: { quantity: true },
    where: {
      isDrink: true,
      order: {
        serviceDay: dayValue(serviceDay),
        OR: [
          { status: { in: ["accepted", "preparing"] } },
          { pickupKind: "asap", AND: [ON_BAR] },
        ],
      },
    },
  });
  return sum._sum.quantity ?? 0;
}

/**
 * Prep Time now and the Pickup Windows with room for `need`, from the
 * day's pickup_window_usage. Checkout shows these; placeOrder re-checks the
 * chosen one under a lock. Prep Time counts this Order's drinks beyond the
 * first (the base covers one): the Glossary's "the current queue and the
 * Lines in the Order". The Bar Screen's make-next counts the queue only.
 */
export async function offeredWindows(
  client: Client | Prisma.TransactionClient,
  at: Date,
  day: OrderingDay,
  need: Counts
): Promise<{ prepMinutes: number; windows: PickupWindow[] }> {
  const usage = await client.pickupWindowUsage.findMany({
    where: { serviceDay: dayValue(day.day) },
  });
  const used = new Map(
    usage.map((u) => [
      u.windowStart.toISOString(),
      { drinks: u.drinks, food: u.food },
    ])
  );
  const ahead =
    (await drinksQueuedAhead(client, day.day)) + Math.max(0, need.drinks - 1);
  const prep = prepMinutes(ahead, day.prep);
  return {
    prepMinutes: prep,
    windows: pickupWindows(at, day, { prepMinutes: prep, need, used }),
  };
}
