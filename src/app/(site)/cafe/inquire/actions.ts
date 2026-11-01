"use server";

import { headers } from "next/headers";

import { clientIp, takeToken } from "@/lib/rate-limit";
import { getCafeContact } from "@/modules/cafe";
import { submitInquiry } from "@/modules/content";
import { sendInquiry } from "@/modules/notify";

export type InquiryState = {
  status: "idle" | "sent" | "error";
  message?: string;
  errors?: Partial<Record<string, string>>;
  /** What was typed, kept after a refusal (React resets the form). */
  values?: Record<string, string>;
};

const FIELDS = ["kind", "name", "email", "wantedOn", "guests", "message"];

/** A Customer sends an Inquiry; the Manager gets an email (INFO-11). */
export async function inquireAction(
  _prev: InquiryState,
  form: FormData
): Promise<InquiryState> {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(form.get(field) ?? "")])
  );
  if (!(await takeToken(`inquiry-ip:${clientIp(await headers())}`, 5, 3600))) {
    return {
      status: "error",
      message: "Too many inquiries from here. Try again in an hour.",
      values,
    };
  }
  const result = await submitInquiry({
    kind: values.kind === "large_order" ? "large_order" : "private_event",
    name: values.name,
    email: values.email,
    wantedOn: values.wantedOn,
    guests: values.guests,
    message: values.message,
  });
  if (!result.ok) {
    return {
      status: "error",
      message: "Some fields need a fix.",
      errors: result.errors,
      values,
    };
  }
  try {
    await sendInquiry((await getCafeContact()).contactEmail, result.inquiry);
  } catch (error) {
    // Saved either way; the Manager also sees it in /manage/inquiries.
    console.error("[inquiry] email not sent:", error);
  }
  return { status: "sent" };
}
