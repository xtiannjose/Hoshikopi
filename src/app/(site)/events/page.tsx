import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlankIcon, CalendarStarIcon } from "@phosphor-icons/react/ssr";

import { EventCard, eventWhen } from "@/components/content/event-card";
import { WeeklyList } from "@/components/content/weekly-list";
import { PageHeader } from "@/components/page-header";
import { Empty, OUTLINE_PILL, Panel } from "@/components/panel";
import { getEvents, getRecurringEvents } from "@/modules/content";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Latte art nights, open mics and cuppings at Hoshikopi in Kapitolyo, Pasig.",
};

export default async function EventsPage() {
  const [{ upcoming, past }, weekly] = await Promise.all([
    getEvents(),
    getRecurringEvents(),
  ]);
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <PageHeader
        title="Events"
        intro="Latte art nights, open mics and cuppings. Come for the coffee, stay for the people."
      />
      {upcoming.length === 0 ? (
        <div className="mt-8">
          <Empty icon={<CalendarBlankIcon size={24} />}>
            <p className="max-w-measure text-lg">
              {weekly.length > 0
                ? "No dated Events right now. Our weekly ones are just below, and News has what's brewing."
                : "No dated Events right now. News has what's brewing."}
            </p>
            <p className="flex flex-wrap gap-x-6 gap-y-2">
              {weekly.length > 0 && (
                <a href="#weekly">See what&apos;s weekly</a>
              )}
              <Link href="/news">Read the News</Link>
            </p>
          </Empty>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      )}
      <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <WeeklyList events={weekly} />
        <Panel
          id="private-events"
          title="Private events"
          icon={<CalendarStarIcon size={20} />}
        >
          <p className="max-w-measure">
            Birthdays, team nights or a small launch? Tell us the date and
            we&apos;ll plan the drinks with you.
          </p>
          <Link href="/cafe/inquire" className={`${OUTLINE_PILL} mt-4`}>
            Send us an inquiry
          </Link>
        </Panel>
      </div>
      {past.length > 0 && (
        <details className="mt-16">
          <summary className="font-display min-h-11 cursor-pointer text-2xl italic">
            Past Events
          </summary>
          <ul className="border-border mt-4 max-w-3xl border-t">
            {past.map((event) => (
              <li key={event.slug} className="border-border border-b py-3">
                <Link
                  href={`/events/${event.slug}`}
                  className="inline-flex min-h-11 items-center font-semibold"
                >
                  {event.title}
                </Link>
                <span className="text-muted-foreground block font-mono text-sm">
                  {eventWhen(event)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="text-muted-foreground mt-12 font-mono text-sm">
        Every Event here is an example: Hoshikopi is a concept cafe.
      </p>
    </main>
  );
}
