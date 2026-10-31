import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { manilaInputValue, now } from "@/lib/clock";
import { formatReceipt } from "@/lib/money";
import { contentForStaff } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

import { EventForm, type EventFormData } from "../../content-forms";

export const metadata: Metadata = { title: "Event" };

export default function ManageEventPage({
  params,
}: PageProps<"/manage/events/[id]">) {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link href="/manage/events">All Events</Link>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <Editor params={params} />
      </Suspense>
    </main>
  );
}

async function Editor({
  params,
}: Pick<PageProps<"/manage/events/[id]">, "params">) {
  await requireStaff("manager", "/manage/events");
  const { id } = await params;
  let event: EventFormData;
  if (id === "new") {
    const week = new Date(now().getTime() + 7 * 86_400_000);
    event = {
      id: null,
      title: "",
      slug: "",
      startsAt: `${manilaInputValue(week).slice(0, 10)}T19:00`,
      endsAt: `${manilaInputValue(week).slice(0, 10)}T21:00`,
      summary: "",
      bodyMd: "",
      price: "",
      signupUrl: "",
      isPublished: false,
    };
  } else {
    const row = (await contentForStaff()).events.find((e) => e.id === id);
    if (!row) notFound();
    event = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      startsAt: manilaInputValue(row.startsAt),
      endsAt: manilaInputValue(row.endsAt),
      summary: row.summary,
      bodyMd: row.bodyMd,
      price: row.priceCents ? formatReceipt(row.priceCents) : "",
      signupUrl: row.signupUrl ?? "",
      isPublished: row.isPublished,
    };
  }
  return (
    <>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">
        {event.id ? event.title : "Add an Event"}
      </h1>
      <EventForm event={event} />
    </>
  );
}
