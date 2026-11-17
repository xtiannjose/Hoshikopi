import type { Client } from "@/lib/db";
import { getOrderingDay, type OrderingDay } from "@/modules/cafe";
import { demoAllDayOrdering } from "@/modules/payments";

/**
 * The hosted demo's ordering hours. Pickup Windows end by closing, so the
 * last one starts at 23:30 and is gone once Prep Time passes it: Last Order
 * is 23:15, and from then the page says ordering has closed instead of
 * "walk in and order at the counter" (audit DC-29). Windows cannot run into
 * the next day, so about 45 minutes a night stay closed.
 */
export const DEMO_HOURS = {
  opensAt: "00:00",
  lastOrderAt: "23:15",
  closesAt: "23:59",
} as const;

/**
 * The ordering facts checkout, placement, the Cart and the Bar Screen use.
 * On the hosted demo the cafe takes Orders all day (ADR 0015 update), so a
 * reviewer in any time zone can try the two-minute demo; Pause, Busy Mode,
 * Capacity and Prep Time still apply. The Visit page keeps the real hours.
 */
export async function orderingDay(
  at: Date,
  client?: Client
): Promise<OrderingDay> {
  const day = await getOrderingDay(at, client);
  return demoAllDayOrdering() ? { ...day, hours: { ...DEMO_HOURS } } : day;
}
