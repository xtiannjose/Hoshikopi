import Link from "next/link";

import { Photo } from "@/components/photo";
import { formatDate, formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import type { EventCard as Event } from "@/modules/content";

/** "Sat, Nov 7, 7:00 PM to 9:00 PM" in Manila time. */
export const eventWhen = (event: Pick<Event, "startsAt" | "endsAt">) =>
  `${formatDate(event.startsAt)}, ${formatTime(event.startsAt)} to ${formatTime(event.endsAt)}`;

export const eventPrice = (event: Pick<Event, "priceCents">) =>
  event.priceCents ? formatPrice(event.priceCents) : "Free";

/** An Event: date block, photo, date line, title, one line, price (EVT-01). */
export function EventCard({
  event,
  headingLevel = 2,
}: {
  event: Event;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  // "Sat, Nov 7": the date block shows the month over the day.
  const [, month, day] = formatDate(event.startsAt).split(/\s+/);
  return (
    <article className="group lift reveal relative grid content-start gap-3">
      <div className="relative">
        <Photo
          src={event.photoUrl}
          alt={event.photoAlt ?? event.title}
          kind="event"
          sizes="(min-width: 1536px) 45rem, (min-width: 768px) 50vw, 100vw"
          className="rounded-card aspect-16/9"
        />
        {/* Decorative: the date line below is the one read aloud. */}
        <div
          aria-hidden
          className="bg-background rounded-card absolute top-3 left-3 px-3 py-2 text-center"
        >
          <span className="block font-mono text-xs uppercase">{month}</span>
          <span className="font-display block text-3xl leading-none italic">
            {day}
          </span>
        </div>
      </div>
      <p className="text-muted-foreground font-mono text-sm">
        {eventWhen(event)}
      </p>
      <Heading className="font-display pb-1 text-2xl italic">
        <Link
          href={`/events/${event.slug}`}
          className="no-underline group-hover:underline after:absolute after:inset-0"
        >
          {event.title}
        </Link>
      </Heading>
      <p>{event.summary}</p>
      <p className="font-mono text-sm">{eventPrice(event)}</p>
    </article>
  );
}
