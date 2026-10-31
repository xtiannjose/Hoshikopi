import { manilaInstant } from "@/lib/clock";
import { toMinutes, type DayHours } from "@/lib/hours";

export type PrepSettings = { baseMinutes: number; perDrinkMinutes: number };

/** What ordering needs to know about one Manila service day. */
export type OrderingDay = {
  day: string;
  /** Null when the cafe is closed all day. */
  hours: DayHours | null;
  /** Per 15-minute Pickup Window: drinks and food Lines (Capacity). */
  capacity: { drinks: number; food: number };
  pausedUntil: Date | null;
  pauseMessage: string | null;
  prep: PrepSettings;
};

export type Counts = { drinks: number; food: number };

export type PickupWindow = {
  start: Date;
  /** Room left before this Order is added. */
  drinksLeft: number;
  foodLeft: number;
};

export const WINDOW_MINUTES = 15;

/**
 * Prep Time for As Soon As Possible: base + per drink x drinks queued ahead
 * (Accepted or Preparing), rounded up to the next 5 minutes (ADR 0007).
 */
export function prepMinutes(drinksAhead: number, prep: PrepSettings): number {
  const minutes = prep.baseMinutes + prep.perDrinkMinutes * drinksAhead;
  return Math.ceil(minutes / 5) * 5;
}

/**
 * Today's Pickup Windows with room for `need`: 15-minute windows from
 * opening that start once the Order can be ready (now + Prep Time) and end
 * by closing. `used` holds counts already taken, keyed by window start ISO
 * (pickup_window_usage belongs to the ordering module).
 */
export function pickupWindows(
  at: Date,
  day: OrderingDay,
  options: { prepMinutes: number; need: Counts; used: Map<string, Counts> }
): PickupWindow[] {
  if (!day.hours) return [];
  const ready = at.getTime() + options.prepMinutes * 60_000;
  const closes = toMinutes(day.hours.closesAt);
  const windows: PickupWindow[] = [];
  for (
    let minute = toMinutes(day.hours.opensAt);
    minute + WINDOW_MINUTES <= closes;
    minute += WINDOW_MINUTES
  ) {
    const start = manilaInstant(day.day, minute);
    if (start.getTime() < ready) continue;
    const used = options.used.get(start.toISOString()) ?? {
      drinks: 0,
      food: 0,
    };
    const drinksLeft = day.capacity.drinks - used.drinks;
    const foodLeft = day.capacity.food - used.food;
    if (drinksLeft >= options.need.drinks && foodLeft >= options.need.food) {
      windows.push({ start, drinksLeft, foodLeft });
    }
  }
  return windows;
}

export type OrderingState =
  | { canOrder: true; lastOrderAt: Date; minutesToLastOrder: number }
  | { canOrder: false; reason: "paused"; until: Date; message: string | null }
  | {
      canOrder: false;
      reason: "before_opening" | "after_last_order" | "closed_today";
    };

/** Whether a Customer can place an Order now, or why not (ORD-07). */
export function orderingState(at: Date, day: OrderingDay): OrderingState {
  if (day.pausedUntil && day.pausedUntil.getTime() > at.getTime()) {
    return {
      canOrder: false,
      reason: "paused",
      until: day.pausedUntil,
      message: day.pauseMessage,
    };
  }
  if (!day.hours) return { canOrder: false, reason: "closed_today" };
  const opens = manilaInstant(day.day, toMinutes(day.hours.opensAt));
  const lastOrderAt = manilaInstant(day.day, toMinutes(day.hours.lastOrderAt));
  if (at.getTime() < opens.getTime()) {
    return { canOrder: false, reason: "before_opening" };
  }
  if (at.getTime() >= lastOrderAt.getTime()) {
    return { canOrder: false, reason: "after_last_order" };
  }
  return {
    canOrder: true,
    lastOrderAt,
    minutesToLastOrder: Math.ceil(
      (lastOrderAt.getTime() - at.getTime()) / 60_000
    ),
  };
}
