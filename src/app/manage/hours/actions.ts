"use server";

import { updateTag } from "next/cache";

import {
  deleteSpecialHours,
  pauseOrdering,
  resumeOrdering,
  saveCapacity,
  saveSpecialHours,
  saveWeeklyHours,
} from "@/modules/cafe";
import { requireStaff } from "@/modules/identity";

export type FormState = {
  status: "idle" | "saved" | "error";
  errors?: Partial<Record<string, string>>;
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
