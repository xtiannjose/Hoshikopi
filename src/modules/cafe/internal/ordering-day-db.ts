import { dayValue, manila } from "@/lib/clock";
import { db, type Client } from "@/lib/db";

import type { OrderingDay } from "./ordering-day";

const hhmm = (time: Date) => time.toISOString().slice(11, 16);

/**
 * The ordering facts for the Manila service day of `at`, read fresh (not
 * cached): checkout and placement must see the latest pause and hours.
 */
export async function getOrderingDay(
  at: Date,
  client: Client = db
): Promise<OrderingDay> {
  const { day, weekday } = manila(at);
  const [special, weekly, capacity, settings] = await Promise.all([
    client.specialHours.findUnique({ where: { day: dayValue(day) } }),
    client.openingHours.findUnique({ where: { weekday } }),
    client.capacityRule.findUnique({ where: { weekday } }),
    client.cafeSettings.findUniqueOrThrow({ where: { id: 1 } }),
  ]);
  const source = special ?? weekly;
  const open =
    source &&
    !source.isClosed &&
    source.opensAt &&
    source.lastOrderAt &&
    source.closesAt;
  return {
    day,
    hours: open
      ? {
          opensAt: hhmm(source.opensAt!),
          lastOrderAt: hhmm(source.lastOrderAt!),
          closesAt: hhmm(source.closesAt!),
        }
      : null,
    capacity: {
      drinks: capacity?.drinksPerWindow ?? 0,
      food: capacity?.foodPerWindow ?? 0,
    },
    pausedUntil: settings.orderingPausedUntil,
    pauseMessage: settings.pauseMessage,
    prep: {
      baseMinutes: settings.prepBaseMinutes.toNumber(),
      perDrinkMinutes: settings.prepPerDrinkMinutes.toNumber(),
    },
  };
}

/** Everything /manage/hours edits, read fresh. */
export async function getHoursForStaff(at: Date) {
  const { day } = manila(at);
  const [weekly, special, capacity, settings] = await Promise.all([
    db.openingHours.findMany({ orderBy: { weekday: "asc" } }),
    db.specialHours.findMany({
      where: { day: { gte: dayValue(day) } },
      orderBy: { day: "asc" },
    }),
    db.capacityRule.findMany({ orderBy: { weekday: "asc" } }),
    db.cafeSettings.findUniqueOrThrow({ where: { id: 1 } }),
  ]);
  return {
    weekly: weekly.map((w) => ({
      weekday: w.weekday,
      isClosed: w.isClosed,
      opensAt: hhmm(w.opensAt),
      lastOrderAt: hhmm(w.lastOrderAt),
      closesAt: hhmm(w.closesAt),
    })),
    special: special.map((s) => ({
      day: s.day.toISOString().slice(0, 10),
      isClosed: s.isClosed,
      opensAt: s.opensAt && hhmm(s.opensAt),
      lastOrderAt: s.lastOrderAt && hhmm(s.lastOrderAt),
      closesAt: s.closesAt && hhmm(s.closesAt),
      note: s.note,
    })),
    capacity: capacity.map((c) => ({
      weekday: c.weekday,
      drinks: c.drinksPerWindow,
      food: c.foodPerWindow,
    })),
    prep: {
      baseMinutes: settings.prepBaseMinutes.toNumber(),
      perDrinkMinutes: settings.prepPerDrinkMinutes.toNumber(),
    },
    pausedUntil:
      settings.orderingPausedUntil && settings.orderingPausedUntil > at
        ? settings.orderingPausedUntil
        : null,
    pauseMessage: settings.pauseMessage,
  };
}
