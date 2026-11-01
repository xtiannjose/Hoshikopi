import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { recurringForStaff } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

import { WeeklyForm } from "./weekly-form";

export const metadata: Metadata = { title: "Recurring Events" };

export default function ManageWeeklyPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage/events">Events</Link>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">
        Recurring Events
      </h1>
      <p className="text-muted-foreground mt-2">
        Weekly, with no date or sign-up. They show on the Events and cafe pages;
        untick Shown on the site to pause one.
      </p>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <List />
      </Suspense>
    </main>
  );
}

async function List() {
  await requireStaff("manager", "/manage/events/weekly");
  const events = await recurringForStaff();
  return (
    <div className="mt-8 grid gap-8">
      {events.map((event) => (
        <WeeklyForm key={event.id} event={event} />
      ))}
      <section aria-labelledby="add-weekly" className="grid gap-4">
        <h2 id="add-weekly" className="font-display pb-1 text-2xl italic">
          Add one
        </h2>
        <WeeklyForm
          event={{
            id: null,
            title: "",
            weekday: 1,
            startsAt: "18:00",
            endsAt: "19:00",
            note: "",
            isPublished: true,
          }}
        />
      </section>
    </div>
  );
}
