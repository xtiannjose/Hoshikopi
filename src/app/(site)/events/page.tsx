import type { Metadata } from "next";

import { EventCard, eventWhen } from "@/components/content/event-card";
import { getEvents } from "@/modules/content";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Latte art nights, open mics and cuppings at Hoshikopi in Kapitolyo, Pasig.",
};

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();
  return (
    <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 md:px-8">
      <h1 className="font-display pt-8 pb-1 text-5xl italic md:text-6xl">
        Events
      </h1>
      {upcoming.length === 0 ? (
        <p className="mt-6 text-lg">
          Nothing on the calendar yet. Check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-2">
          {upcoming.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      )}
      {past.length > 0 && (
        <details className="mt-16">
          <summary className="font-display min-h-11 cursor-pointer text-2xl italic">
            Past Events
          </summary>
          <ul className="border-border mt-4 border-t">
            {past.map((event) => (
              <li key={event.slug} className="border-border border-b py-3">
                <span className="font-semibold">{event.title}</span>
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
