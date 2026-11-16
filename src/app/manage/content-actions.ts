"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  deletePost,
  removeSignup,
  saveEvent,
  savePost,
  saveRecurringEvent,
  signupsForEvent,
} from "@/modules/content";
import { requireStaff } from "@/modules/identity";

export type ContentFormState = {
  status: "idle" | "saved" | "error";
  errors?: Partial<Record<string, string>>;
  /** What the save bar says when saved, if not just "Saved.". */
  saved?: string;
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
  if (!id) redirect(`/manage/events/${result.id}?added=1`);
  // Fewer Seats than taken, or off the site with Sign-ups: nobody is told,
  // so say so (audit staff:10).
  const signups = await signupsForEvent(id);
  const taken = signups.reduce((sum, signup) => sum + signup.seats, 0);
  const seats = Number(text(form, "seats") || NaN);
  if (taken > seats) {
    return {
      status: "saved",
      saved: `Saved. ${taken} Seats are already taken, more than the ${seats} you set. Guests aren't told: remove Sign-ups or email them from the list.`,
    };
  }
  if (signups.length > 0 && !form.get("isPublished")) {
    return {
      status: "saved",
      saved: `Saved. It's off the site, and ${signups.length === 1 ? "1 Sign-up still holds" : `${signups.length} Sign-ups still hold`} Seats. Guests aren't told: email them from the list.`,
    };
  }
  return { status: "saved" };
}

/** A Manager removes a Sign-up (audit staff:10, SEC2-02). */
export async function removeSignupAction(form: FormData) {
  const staff = await requireStaff("manager", "/manage/events");
  if (await removeSignup(text(form, "id"), staff)) updateTag("events");
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
  if (!id) redirect(`/manage/posts/${result.id}?added=1`);
  return { status: "saved" };
}

/** Deletes a draft Post (audit staff:9); drafts are not on the site. */
export async function deletePostAction(form: FormData) {
  const staff = await requireStaff("manager", "/manage/posts");
  if (await deletePost(text(form, "id"), staff)) redirect("/manage/posts");
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
