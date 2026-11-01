"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { saveEvent, savePost, saveRecurringEvent } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

export type ContentFormState = {
  status: "idle" | "saved" | "error";
  errors?: Partial<Record<string, string>>;
};

const text = (form: FormData, name: string) => String(form.get(name) ?? "");

/** Managers write Events (STAFF-06); public pages refresh by the content tag. */
export async function saveEventAction(
  _prev: ContentFormState,
  form: FormData
): Promise<ContentFormState> {
  const staff = await requireStaff("manager", "/manage/events");
  const id = text(form, "id") || null;
  const result = await saveEvent(
    id,
    {
      title: text(form, "title"),
      slug: text(form, "slug"),
      startsAt: text(form, "startsAt"),
      endsAt: text(form, "endsAt"),
      summary: text(form, "summary"),
      bodyMd: text(form, "bodyMd"),
      price: text(form, "price"),
      signupUrl: text(form, "signupUrl"),
      seats: text(form, "seats"),
      isPublished: form.get("isPublished") ?? undefined,
    },
    staff
  );
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("content");
  if (!id) redirect(`/manage/events/${result.id}`);
  return { status: "saved" };
}

export async function savePostAction(
  _prev: ContentFormState,
  form: FormData
): Promise<ContentFormState> {
  const staff = await requireStaff("manager", "/manage/posts");
  const id = text(form, "id") || null;
  const result = await savePost(
    id,
    {
      title: text(form, "title"),
      slug: text(form, "slug"),
      excerpt: text(form, "excerpt"),
      bodyMd: text(form, "bodyMd"),
      isPublished: form.get("isPublished") ?? undefined,
    },
    staff
  );
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("content");
  if (!id) redirect(`/manage/posts/${result.id}`);
  return { status: "saved" };
}

/** Managers write Recurring Events (EVT-03). */
export async function saveRecurringAction(
  _prev: ContentFormState,
  form: FormData
): Promise<ContentFormState> {
  const staff = await requireStaff("manager", "/manage/events/weekly");
  const result = await saveRecurringEvent(
    text(form, "id") || null,
    {
      title: text(form, "title"),
      weekday: text(form, "weekday"),
      startsAt: text(form, "startsAt"),
      endsAt: text(form, "endsAt"),
      note: text(form, "note"),
      isPublished: form.get("isPublished") ?? undefined,
    },
    staff
  );
  if (!result.ok) return { status: "error", errors: result.errors };
  updateTag("content");
  return { status: "saved" };
}
