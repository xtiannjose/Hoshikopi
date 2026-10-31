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

/** Drinks in Orders the bar is making now, for Prep Time (ADR 0007). */
export async function drinksQueuedAhead(client: Client, serviceDay: string) {
  const sum = await client.orderLine.aggregate({
    _sum: { quantity: true },
    where: {
      isDrink: true,
      order: {
        serviceDay: dayValue(serviceDay),
        status: { in: ["accepted", "preparing"] },
      },
    },
  });
  return sum._sum.quantity ?? 0;
}

/**
 * Prep Time now and the Pickup Windows with room for `need`, from the
 * day's pickup_window_usage. Checkout shows these; placeOrder re-checks the
 * chosen one under a lock.
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
  const prep = prepMinutes(await drinksQueuedAhead(client, day.day), day.prep);
  return {
    prepMinutes: prep,
    windows: pickupWindows(at, day, { prepMinutes: prep, need, used }),
  };
}
