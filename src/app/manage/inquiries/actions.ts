"use server";

import { redirect } from "next/navigation";

import { setInquiryStatus } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

const STATUSES = ["new", "answered", "closed"] as const;

/** A Manager marks an Inquiry answered, closed or new again (INFO-11).
 * Back on the list, the card says what changed. */
export async function inquiryStatusAction(form: FormData) {
  const staff = await requireStaff("manager", "/manage/inquiries");
  const status = STATUSES.find((s) => s === form.get("status"));
  const id = String(form.get("id") ?? "");
  if (status && id) await setInquiryStatus(id, status, staff);
  const done = encodeURIComponent(id);
  redirect(`/manage/inquiries?done=${done}#inquiry-${done}`);
}
