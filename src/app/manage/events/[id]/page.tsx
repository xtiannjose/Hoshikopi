import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { manilaInputValue, now } from "@/lib/clock";
import { formatReceipt } from "@/lib/money";
import { contentForStaff, signupsForEvent } from "@/modules/content";
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
      seats: "",
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
      seats: row.seats?.toString() ?? "",
      isPublished: row.isPublished,
    };
  }
  return (
    <>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">
        {event.id ? event.title : "Add an Event"}
      </h1>
      <EventForm event={event} />
      {event.id && <Signups eventId={event.id} />}
    </>
  );
}

/** Who signed up (EVT-02). */
async function Signups({ eventId }: { eventId: string }) {
  const signups = await signupsForEvent(eventId);
  const seats = signups.reduce((sum, signup) => sum + signup.seats, 0);
  return (
    <section aria-labelledby="signups" className="mt-12 max-w-3xl">
      <h2 id="signups" className="font-display pb-1 text-2xl italic">
        Sign-ups
      </h2>
      {signups.length === 0 ? (
        <p className="mt-2">No Sign-ups yet.</p>
      ) : (
        <>
          <p className="mt-2">
            {signups.length} {signups.length === 1 ? "Sign-up" : "Sign-ups"},{" "}
            {seats} {seats === 1 ? "seat" : "seats"}.
          </p>
          <ul className="border-border mt-3 border-t">
            {signups.map((signup) => (
              <li
                key={signup.id}
                className="border-border flex flex-wrap justify-between gap-3 border-b py-2"
              >
                <span>
                  {signup.name}{" "}
                  <a href={`mailto:${signup.email}`}>{signup.email}</a>
                </span>
                <span className="font-mono">
                  {signup.seats} {signup.seats === 1 ? "seat" : "seats"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
