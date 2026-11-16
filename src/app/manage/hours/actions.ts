"use server";

import { updateTag } from "next/cache";

import {
  BUSY_FOR_MINUTES,
  BUSY_MINUTES,
  deleteSpecialHours,
  endBusyMode,
  pauseOrdering,
  resumeOrdering,
  saveCapacity,
  saveSpecialHours,
  saveWeeklyHours,
  startBusyMode,
} from "@/modules/cafe";
import { manila, manilaInstant, now } from "@/lib/clock";
import { toMinutes } from "@/lib/hours";
import { requireStaff } from "@/modules/identity";
import { ordersBookedAfter } from "@/modules/ordering";

export type FormState = {
  status: "idle" | "saved" | "error";
  errors?: Partial<Record<string, string>>;
  /** What the save bar says when saved, if not just "Saved.". */
  saved?: string;
};

const text = (form: FormData, name: string) => String(form.get(name) ?? "");
const WEEK = [0, 1, 2, 3, 4, 5, 6];

const manager = () => requireStaff("manager", "/manage/hours");

export async function saveWeeklyHoursAction(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const staff = await manager();
  const result = await saveWeeklyHours(
    WEEK.map((weekday) => ({
      weekday,
      isClosed: form.get(`closed-${weekday}`) === "on",
      opensAt: text(form, `opens-${weekday}`),
      lastOrderAt: text(form, `last-${weekday}`),
      closesAt: text(form, `closes-${weekday}`),
    })),
    staff
  );
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("hours");
  return { status: "saved" };
}

export async function saveSpecialHoursAction(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const staff = await manager();
  const isClosed = form.get("isClosed") === "on";
  const result = await saveSpecialHours(
    {
      day: text(form, "day"),
      isClosed,
      opensAt: isClosed ? undefined : text(form, "opensAt"),
      lastOrderAt: isClosed ? undefined : text(form, "lastOrderAt"),
      closesAt: isClosed ? undefined : text(form, "closesAt"),
      note: text(form, "note"),
    },
    staff
  );
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("hours");
  // Closing or shortening today can leave Orders after the new closing:
  // say how many, so the Manager can cancel them (audit ORD-20).
  const day = text(form, "day");
  if (day === manila(now()).day) {
    const closesAt = text(form, "closesAt");
    const booked = await ordersBookedAfter(
      isClosed || !closesAt ? now() : manilaInstant(day, toMinutes(closesAt))
    );
    if (booked > 0) {
      return {
        status: "saved",
        saved: `Saved. ${booked === 1 ? "1 Order today is" : `${booked} Orders today are`} booked after the new closing. Cancel ${booked === 1 ? "it" : "them"} with a reason on the Orders page.`,
      };
    }
  }
  return { status: "saved" };
}

export async function deleteSpecialHoursAction(form: FormData) {
  const staff = await manager();
  await deleteSpecialHours(text(form, "day"), staff);
  updateTag("hours");
}

export async function saveCapacityAction(
  _prev: FormState,
  form: FormData
): Promise<FormState> {
  const staff = await manager();
  const result = await saveCapacity(
    WEEK.map((weekday) => ({
      weekday,
      drinks: text(form, `drinks-${weekday}`),
      food: text(form, `food-${weekday}`),
    })),
    {
      baseMinutes: text(form, "baseMinutes"),
      perDrinkMinutes: text(form, "perDrinkMinutes"),
    },
    staff
  );
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("hours");
  return { status: "saved" };
}

/** Pause or resume new Orders; Managers only (STAFF-05). */
export async function pauseAction(form: FormData) {
  const staff = await manager();
  const minutes = Math.min(
    Math.max(Number(text(form, "minutes")) || 30, 5),
    720
  );
  await pauseOrdering(minutes, text(form, "message"), staff);
  updateTag("hours");
}

export async function resumeAction() {
  const staff = await manager();
  await resumeOrdering(staff);
  updateTag("hours");
}

/** Busy Mode from the Bar Screen (8.4): only the offered amounts go in. */
export async function busyAction(form: FormData) {
  const staff = await manager();
  const minutes = Number(text(form, "minutes"));
  const forMinutes = Number(text(form, "forMinutes"));
  if (
    !(BUSY_MINUTES as readonly number[]).includes(minutes) ||
    !(BUSY_FOR_MINUTES as readonly number[]).includes(forMinutes)
  ) {
    return;
  }
  await startBusyMode(minutes, forMinutes, staff);
  updateTag("hours");
}

export async function endBusyAction() {
  const staff = await manager();
  await endBusyMode(staff);
  updateTag("hours");
}
