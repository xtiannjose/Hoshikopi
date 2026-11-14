import type { Client } from "@/lib/db";
import { getOrderingDay, type OrderingDay } from "@/modules/cafe";
import { demoAllDayOrdering } from "@/modules/payments";

/** The hosted demo's ordering hours: the same span the e2e tests open. */
export const DEMO_HOURS = {
  opensAt: "00:00",
  lastOrderAt: "23:45",
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
