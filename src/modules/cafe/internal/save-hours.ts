import { z } from "zod";

import { dayValue, now } from "@/lib/clock";
import { db } from "@/lib/db";
import { toMinutes } from "@/lib/hours";
import { audit, type Staff } from "@/modules/identity";

// Manager writes for hours, Capacity, Prep Time and Ordering Paused
// (STAFF-05). Callers check the role and call updateTag("hours").

export type HoursResult =
  { ok: true } | { ok: false; errors: Partial<Record<string, string>> };

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time.");
const asTime = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00Z`);

const ordered = (h: {
  opensAt: string;
  lastOrderAt: string;
  closesAt: string;
}) =>
  toMinutes(h.opensAt) < toMinutes(h.lastOrderAt) &&
  toMinutes(h.lastOrderAt) <= toMinutes(h.closesAt);

const ORDER_MESSAGE = "Last order must be after opening and by closing.";

const WeeklyRow = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  isClosed: z.coerce.boolean(),
  opensAt: time,
  lastOrderAt: time,
  closesAt: time,
});

/** All seven days' Opening Hours; errors are keyed by weekday. */
export async function saveWeeklyHours(
  rows: z.input<typeof WeeklyRow>[],
  actor: Staff
): Promise<HoursResult> {
  const errors: Record<string, string> = {};
  const parsed = rows.map((row) => {
    const result = WeeklyRow.safeParse(row);
    if (!result.success) {
      errors[String(row.weekday)] = "Enter opening, last order and closing.";
      return null;
    }
    if (!result.data.isClosed && !ordered(result.data)) {
      errors[String(result.data.weekday)] = ORDER_MESSAGE;
    }
    return result.data;
  });
  if (Object.keys(errors).length) return { ok: false, errors };
  await db.$transaction(async (tx) => {
    for (const row of parsed) {
      if (!row) continue;
      const data = {
        isClosed: row.isClosed,
        opensAt: asTime(row.opensAt),
        lastOrderAt: asTime(row.lastOrderAt),
        closesAt: asTime(row.closesAt),
      };
      await tx.openingHours.upsert({
        where: { weekday: row.weekday },
        update: data,
        create: { weekday: row.weekday, ...data },
      });
    }
    await audit(
      actor,
      "cafe.hours.update",
      { type: "opening_hours", id: "week" },
      {},
      tx
    );
  });
  return { ok: true };
}

const SpecialInput = z
  .object({
    day: z.iso.date("Choose a date."),
    isClosed: z.coerce.boolean(),
    opensAt: time.optional(),
    lastOrderAt: time.optional(),
    closesAt: time.optional(),
    note: z.string().trim().max(80).optional(),
  })
  .refine(
    (s) =>
      s.isClosed ||
      (s.opensAt &&
        s.lastOrderAt &&
        s.closesAt &&
        ordered({
          opensAt: s.opensAt,
          lastOrderAt: s.lastOrderAt,
          closesAt: s.closesAt,
        })),
    { path: ["lastOrderAt"], message: ORDER_MESSAGE }
  );

/** Set or replace one day's Special Hours. */
export async function saveSpecialHours(
  input: z.input<typeof SpecialInput>,
  actor: Staff
): Promise<HoursResult> {
  const parsed = SpecialInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[String(issue.path[0])] ??= issue.message;
    }
    return { ok: false, errors };
  }
  const s = parsed.data;
  const data = {
    isClosed: s.isClosed,
    opensAt: s.isClosed ? null : asTime(s.opensAt!),
    lastOrderAt: s.isClosed ? null : asTime(s.lastOrderAt!),
    closesAt: s.isClosed ? null : asTime(s.closesAt!),
    note: s.note || null,
  };
  await db.$transaction(async (tx) => {
    await tx.specialHours.upsert({
      where: { day: dayValue(s.day) },
      update: data,
      create: { day: dayValue(s.day), ...data },
    });
    await audit(
      actor,
      "cafe.special_hours.save",
      { type: "special_hours", id: s.day },
      {},
      tx
    );
  });
  return { ok: true };
}

export async function deleteSpecialHours(day: string, actor: Staff) {
  await db.$transaction(async (tx) => {
    await tx.specialHours.deleteMany({ where: { day: dayValue(day) } });
    await audit(
      actor,
      "cafe.special_hours.delete",
      { type: "special_hours", id: day },
      {},
      tx
    );
  });
}

const count = z.coerce.number().int().min(0).max(200);
const minutes = z.coerce.number().min(0).max(60);

/** Capacity per weekday and the two Prep Time numbers. */
export async function saveCapacity(
  rows: { weekday: number; drinks: string; food: string }[],
  prep: { baseMinutes: string; perDrinkMinutes: string },
  actor: Staff
): Promise<HoursResult> {
  const errors: Record<string, string> = {};
  const parsed = rows.map((row) => {
    const drinks = count.safeParse(row.drinks);
    const food = count.safeParse(row.food);
    if (!drinks.success || !food.success) {
      errors[String(row.weekday)] = "Use whole numbers from 0 to 200.";
    }
    return {
      weekday: row.weekday,
      drinks: drinks.data ?? 0,
      food: food.data ?? 0,
    };
  });
  const base = minutes.safeParse(prep.baseMinutes);
  const perDrink = minutes.safeParse(prep.perDrinkMinutes);
  if (!base.success) errors.baseMinutes = "Use minutes from 0 to 60.";
  if (!perDrink.success) errors.perDrinkMinutes = "Use minutes from 0 to 60.";
  if (Object.keys(errors).length) return { ok: false, errors };
  await db.$transaction(async (tx) => {
    for (const row of parsed) {
      const data = { drinksPerWindow: row.drinks, foodPerWindow: row.food };
      await tx.capacityRule.upsert({
        where: { weekday: row.weekday },
        update: data,
        create: { weekday: row.weekday, ...data },
      });
    }
    await tx.cafeSettings.update({
      where: { id: 1 },
      data: {
        prepBaseMinutes: base.data!,
        prepPerDrinkMinutes: perDrink.data!,
      },
    });
    await audit(
      actor,
      "cafe.capacity.update",
      { type: "capacity_rules", id: "week" },
      {},
      tx
    );
  });
  return { ok: true };
}

/** Stop new Orders for `forMinutes`, with a message for Customers. */
export async function pauseOrdering(
  forMinutes: number,
  message: string,
  actor: Staff
) {
  const until = new Date(now().getTime() + forMinutes * 60_000);
  await db.$transaction(async (tx) => {
    await tx.cafeSettings.update({
      where: { id: 1 },
      data: {
        orderingPausedUntil: until,
        pauseMessage: message.trim().slice(0, 160) || null,
      },
    });
    await audit(
      actor,
      "cafe.ordering.pause",
      { type: "cafe_settings", id: "1" },
      { forMinutes },
      tx
    );
  });
}

export async function resumeOrdering(actor: Staff) {
  await db.$transaction(async (tx) => {
    await tx.cafeSettings.update({
      where: { id: 1 },
      data: { orderingPausedUntil: null, pauseMessage: null },
    });
    await audit(
      actor,
      "cafe.ordering.resume",
      { type: "cafe_settings", id: "1" },
      {},
      tx
    );
  });
}
