import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { formatDate, formatTime, manilaInstant } from "@/lib/clock";
import { inquiriesForStaff, type InquiryView } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

import { inquiryStatusAction } from "./actions";

export const metadata: Metadata = { title: "Inquiries" };

const KIND = { private_event: "Private event", large_order: "Large order" };
const STATUS = { new: "New", answered: "Answered", closed: "Closed" };
const NEXT: Record<InquiryView["status"], [InquiryView["status"], string][]> = {
  new: [
    ["answered", "Mark answered"],
    ["closed", "Close"],
  ],
  answered: [["closed", "Close"]],
  closed: [["new", "Reopen"]],
};

export default function ManageInquiriesPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage">Manage</Link>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">Inquiries</h1>
      <p className="text-muted-foreground mt-2">
        Private events and large Orders from the cafe page. Reply by email, then
        mark them answered.
      </p>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <List />
      </Suspense>
    </main>
  );
}

async function List() {
  await requireStaff("manager", "/manage/inquiries");
  const inquiries = await inquiriesForStaff();
  if (inquiries.length === 0) {
    return <p className="mt-6">No inquiries yet.</p>;
  }
  return (
    <ul className="border-border mt-6 border-t">
      {inquiries.map((inquiry) => (
        <li key={inquiry.id} className="border-border grid gap-2 border-b py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {KIND[inquiry.kind]} from {inquiry.name}
            </h2>
            <span className="text-muted-foreground font-mono text-sm">
              {STATUS[inquiry.status]}, {formatDate(inquiry.createdAt)}{" "}
              {formatTime(inquiry.createdAt)}
            </span>
          </div>
          <p>
            <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
            {inquiry.wantedOn &&
              `, for ${formatDate(manilaInstant(inquiry.wantedOn, 12 * 60))}`}
            {inquiry.guests && `, ${inquiry.guests} guests or drinks`}
          </p>
          <p className="whitespace-pre-line">{inquiry.message}</p>
          <div className="flex flex-wrap gap-2">
            {NEXT[inquiry.status].map(([status, label]) => (
              <form key={status} action={inquiryStatusAction}>
                <input type="hidden" name="id" value={inquiry.id} />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  className="border-input min-h-11 rounded-full border px-4 font-semibold"
                >
                  {label}
                  <span className="sr-only"> ({inquiry.name})</span>
                </button>
              </form>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
