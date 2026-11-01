import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { formatDate, formatTime } from "@/lib/clock";
import { contentForStaff } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

export const metadata: Metadata = { title: "Events" };

export default function ManageEventsPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage">Manage</Link>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">Events</h1>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <List />
      </Suspense>
    </main>
  );
}

async function List() {
  await requireStaff("manager", "/manage/events");
  const { events } = await contentForStaff();
  return (
    <div className="mt-6 grid gap-4">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/manage/events/new" className="font-semibold">
          Add an Event
        </Link>
        <Link href="/manage/events/weekly" className="font-semibold">
          Recurring Events
        </Link>
      </div>
      <ul className="border-border border-t">
        {events.map((event) => (
          <li key={event.id} className="border-border border-b py-3">
            <Link href={`/manage/events/${event.id}`}>{event.title}</Link>
            <span className="text-muted-foreground block text-sm">
              {formatDate(event.startsAt)}, {formatTime(event.startsAt)}
              {!event.isPublished && " (draft)"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
