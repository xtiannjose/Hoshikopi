import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  CalendarStarIcon,
  PlusIcon,
  RepeatIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Empty, OUTLINE_PILL, Pill, PRIMARY_PILL } from "@/components/panel";
import { formatDate, formatTime, now } from "@/lib/clock";
import { contentForStaff } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

export const metadata: Metadata = { title: "Events" };

type StaffEvent = Awaited<ReturnType<typeof contentForStaff>>["events"][number];

const ADD = (
  <Link href="/manage/events/new" className={PRIMARY_PILL}>
    <PlusIcon aria-hidden size={18} />
    Add an Event
  </Link>
);

export default function ManageEventsPage() {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <div className="grid gap-8">
        <PageHeader
          back={<BackLink href="/manage">Manage</BackLink>}
          title="Events"
          size="staff"
          intro="Dated Events with their Sign-ups. The weekly ones live under Recurring Events."
          actions={
            <>
              {ADD}
              <Link href="/manage/events/weekly" className={OUTLINE_PILL}>
                <RepeatIcon aria-hidden size={18} />
                Recurring Events
              </Link>
            </>
          }
        />
        <Suspense fallback={<p>Loading...</p>}>
          <List />
        </Suspense>
      </div>
    </main>
  );
}

async function List() {
  await requireStaff("manager", "/manage/events");
  const { events } = await contentForStaff();
  if (events.length === 0) {
    return (
      <Empty icon={<CalendarStarIcon size={24} />}>
        <p>
          No Events yet. A cupping or a latte art night gives regulars a reason
          to drop by.
        </p>
        {ADD}
      </Empty>
    );
  }
  // Newest first from the query; an Event is past once it ends.
  const at = now();
  const past = events.filter((e) => e.endsAt < at);
  const coming = events.filter((e) => e.endsAt >= at).reverse();
  const pastList = <Tiles events={past} past />;
  return (
    <div className="grid gap-10">
      <section aria-labelledby="coming-up" className="grid gap-4">
        <h2 id="coming-up" className="font-display text-2xl italic">
          Coming up
        </h2>
        {coming.length > 0 ? (
          <Tiles events={coming} />
        ) : (
          <p className="text-muted-foreground max-w-measure">
            Nothing on the calendar yet. Add an Event to give regulars a date to
            look forward to.
          </p>
        )}
      </section>
      {past.length > 0 && (
        <section aria-labelledby="past" className="grid gap-4">
          <h2 id="past" className="font-display text-2xl italic">
            Past
          </h2>
          {past.length > 5 ? (
            <details>
              <summary className="min-h-11 cursor-pointer py-2 font-semibold">
                Show {past.length} past Events
              </summary>
              <div className="mt-4">{pastList}</div>
            </details>
          ) : (
            pastList
          )}
        </section>
      )}
    </div>
  );
}

function Tiles({ events, past }: { events: StaffEvent[]; past?: boolean }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => {
        // "Thu, Nov 12" split into the date block's three lines.
        const [weekday, monthDay] = formatDate(event.startsAt).split(", ");
        const [month, day] = monthDay.split(" ");
        return (
          <li
            key={event.id}
            className="group rounded-card border-border hover:bg-muted relative flex gap-4 border p-4"
          >
            <p className="bg-muted group-hover:bg-background rounded-card grid w-16 shrink-0 content-center justify-items-center py-2 font-mono text-xs">
              <span className="uppercase">{month}</span>
              <span className="font-display text-3xl leading-none">{day}</span>
              <span>{weekday}</span>
            </p>
            <div className="grid min-w-0 content-start gap-1.5">
              {/* The whole tile opens the Event; the title is the link's name. */}
              <Link
                href={`/manage/events/${event.id}`}
                className="font-semibold after:absolute after:inset-0"
              >
                {event.title}
              </Link>
              <p className="text-muted-foreground text-sm">
                {formatTime(event.startsAt)}
                {event.seats !== null &&
                  `, ${event.seatsTaken} of ${event.seats} seats taken`}
              </p>
              <p className="flex flex-wrap gap-1.5">
                {!event.isPublished && <Pill tone="muted">Draft</Pill>}
                {event.isPublished && !past && (
                  <Pill tone="success">Published</Pill>
                )}
                {past && <Pill tone="muted">Past</Pill>}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
