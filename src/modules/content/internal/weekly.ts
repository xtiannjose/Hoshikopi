import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { audit, type Staff } from "@/modules/identity";

import type { ContentResult } from "./content";

export type RecurringEventView = {
  id: string;
  title: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  note: string;
  isPublished: boolean;
};

const select = {
  id: true,
  title: true,
  weekday: true,
  startsAt: true,
  endsAt: true,
  note: true,
  isPublished: true,
} as const;

// Monday first, as a cafe's week reads.
const byWeek = (a: RecurringEventView, b: RecurringEventView) =>
  ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) ||
  a.startsAt.localeCompare(b.startsAt);

/** Published Recurring Events, Monday first (EVT-03). */
export async function readRecurringEvents(): Promise<RecurringEventView[]> {
  const rows = await db.recurringEvent.findMany({
    where: { isPublished: true },
    select,
  });
  return rows.sort(byWeek);
}

export async function getRecurringEvents() {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  return readRecurringEvents();
}

/** Every Recurring Event, hidden ones too, for /manage. */
export async function recurringForStaff(): Promise<RecurringEventView[]> {
  return (await db.recurringEvent.findMany({ select })).sort(byWeek);
}

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time.");

const RecurringInput = z
  .object({
    title: z.string().trim().min(1, "Enter a title.").max(60),
    weekday: z.coerce.number().int().min(0).max(6),
    startsAt: time,
    endsAt: time,
    note: z.string().trim().max(120),
    isPublished: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  })
  .refine((e) => e.endsAt > e.startsAt, {
    path: ["endsAt"],
    message: "The end must be after the start.",
  });

export type RecurringInput = z.input<typeof RecurringInput>;

/** Create (no id) or edit a Recurring Event; Staff writes are audited. */
export async function saveRecurringEvent(
  id: string | null,
  input: RecurringInput,
  actor: Staff
): Promise<ContentResult> {
  const parsed = RecurringInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, errors };
  }
  const saved = await db.$transaction(async (tx) => {
    const row = id
      ? await tx.recurringEvent.update({ where: { id }, data: parsed.data })
      : await tx.recurringEvent.create({ data: parsed.data });
    await audit(
      actor,
      id ? "content.recurring.update" : "content.recurring.create",
      { type: "recurring_event", id: row.id },
      {},
      tx
    );
    return row;
  });
  return { ok: true, id: saved.id };
}
