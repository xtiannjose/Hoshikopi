import { z } from "zod";

import { plainText } from "@/lib/text";

import { dayOf, dayValue, manila, now } from "@/lib/clock";
import { db } from "@/lib/db";
import { audit, type Staff } from "@/modules/identity";

export type InquiryView = {
  id: string;
  kind: "private_event" | "large_order";
  name: string;
  email: string;
  wantedOn: string | null;
  guests: number | null;
  message: string;
  status: "new" | "answered" | "closed";
  createdAt: Date;
};

const InquiryInput = z.object({
  kind: z.enum(["private_event", "large_order"]),
  name: plainText
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Use 80 characters or fewer."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Enter an email address, like hoshi@example.com.")
    // z.email, as checkout: the old regex let "x@y.z?cc=a%40b.c" through
    // into the Manager's mailto links (audit SEC2-01).
    .pipe(z.email("Enter an email address, like hoshi@example.com.")),
  wantedOn: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Choose a date."),
  guests: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && +v >= 1 && +v <= 500),
      "Enter a number of guests from 1 to 500."
    ),
  message: plainText
    .trim()
    .min(1, "Tell us a little about it.")
    .max(1000, "Keep it under 1,000 characters."),
});

export type InquiryInput = z.input<typeof InquiryInput>;

export type InquiryResult =
  | { ok: true; inquiry: InquiryView }
  | { ok: false; errors: Partial<Record<string, string>> };

/** Save a Customer's Inquiry (INFO-11); a wanted date can't be past. */
export async function submitInquiry(
  input: InquiryInput
): Promise<InquiryResult> {
  const parsed = InquiryInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, errors };
  }
  const { wantedOn, guests, ...rest } = parsed.data;
  if (wantedOn && wantedOn < manila(now()).day) {
    return { ok: false, errors: { wantedOn: "Choose today or a later date." } };
  }
  const row = await db.inquiry.create({
    data: {
      ...rest,
      wantedOn: wantedOn ? dayValue(wantedOn) : null,
      guests: guests ? Number(guests) : null,
      createdAt: now(),
    },
  });
  return { ok: true, inquiry: toView(row) };
}

function toView(row: {
  id: string;
  kind: InquiryView["kind"];
  name: string;
  email: string;
  wantedOn: Date | null;
  guests: number | null;
  message: string;
  status: InquiryView["status"];
  createdAt: Date;
}): InquiryView {
  return {
    ...row,
    wantedOn: row.wantedOn && dayOf(row.wantedOn),
  };
}

/** Inquiries for the Manager: open ones first, newest first. */
export async function inquiriesForStaff(): Promise<InquiryView[]> {
  // New first (the enum's order is new, answered, closed), in the query,
  // so a New Inquiry is never cut off by 200 newer ones (audit DATA-02).
  const rows = await db.inquiry.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  return rows.map(toView);
}

/** A Manager marks an Inquiry answered, closed, or new again. */
export async function setInquiryStatus(
  id: string,
  status: InquiryView["status"],
  actor: Staff
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.inquiry.update({ where: { id }, data: { status } });
    await audit(
      actor,
      "content.inquiry.status",
      { type: "inquiry", id },
      { status },
      tx
    );
  });
}
