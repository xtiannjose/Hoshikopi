import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { OUTLINE_PILL, Panel, Pill } from "@/components/panel";
import { manilaInputValue, now } from "@/lib/clock";
import { formatReceipt } from "@/lib/money";
import { contentForStaff, signupsForEvent } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

import { EventForm, type EventFormData } from "../../content-forms";

export const metadata: Metadata = { title: "Event" };

const back = <BackLink href="/manage/events">Events</BackLink>;

export default function ManageEventPage({
  params,
  searchParams,
}: PageProps<"/manage/events/[id]">) {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <Suspense
        fallback={
          <div className="grid gap-2">
            {back}
            <p>Loading...</p>
          </div>
        }
      >
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

type Saved = {
  id: string;
  slug: string;
  seats: number | null;
  isPublished: boolean;
};

async function Editor({
  params,
  searchParams,
}: Pick<PageProps<"/manage/events/[id]">, "params" | "searchParams">) {
  await requireStaff("manager", "/manage/events");
  const [{ id }, { added }] = await Promise.all([params, searchParams]);
  let event: EventFormData;
  let saved: Saved | null = null;
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
    saved = row;
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
  const href = `/events/${event.slug}`;
  return (
    <div className="grid gap-8">
      <PageHeader
        back={back}
        title={event.id ? event.title : "Add an Event"}
        size="staff"
        actions={
          saved &&
          (saved.isPublished ? (
            <Link href={href} className={OUTLINE_PILL}>
              See it on the site
              <ArrowSquareOutIcon aria-hidden size={18} />
            </Link>
          ) : (
            <Pill tone="muted">Draft: not on the site yet</Pill>
          ))
        }
      />
      {saved && added && (
        <p className="bg-muted rounded-card flex flex-wrap items-center gap-3 p-4">
          <CheckCircleIcon aria-hidden size={22} className="text-success" />
          {saved.isPublished ? (
            <>
              Added.{" "}
              <Link href={href} className="font-semibold">
                See it on the site
              </Link>
            </>
          ) : (
            "Saved as a draft. Tick Published on the site when it's ready."
          )}
        </p>
      )}
      <EventForm event={event} aside={saved && <Signups event={saved} />} />
    </div>
  );
}

/** Who signed up (EVT-02). Read only: no removing or confirming here. */
async function Signups({ event }: { event: Saved }) {
  const signups = await signupsForEvent(event.id);
  const taken = signups.reduce((sum, signup) => sum + signup.seats, 0);
  return (
    <Panel id="signups" title="Sign-ups" icon={<UsersThreeIcon size={20} />}>
      <div className="grid gap-3">
        <p className={event.seats === null ? "text-muted-foreground" : ""}>
          {event.seats === null
            ? "Sign-ups here are off. Add Seats above to take them on the Event page."
            : `${taken} of ${event.seats} seats taken, ${Math.max(event.seats - taken, 0)} left.`}
        </p>
        {signups.length === 0 ? (
          event.seats !== null && (
            <p className="text-muted-foreground">
              No Sign-ups yet. Share the{" "}
              {event.isPublished ? (
                <Link href={`/events/${event.slug}`}>Event page</Link>
              ) : (
                "Event page"
              )}{" "}
              to fill the seats.
            </p>
          )
        ) : (
          <ul className="border-border border-t">
            {signups.map((signup) => (
              <li
                key={signup.id}
                className="border-border flex flex-wrap justify-between gap-x-3 border-b py-2"
              >
                <span className="min-w-0">
                  {signup.name}{" "}
                  <a href={`mailto:${signup.email}`} className="break-all">
                    {signup.email}
                  </a>
                </span>
                <span className="font-mono">
                  {signup.seats} {signup.seats === 1 ? "seat" : "seats"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
