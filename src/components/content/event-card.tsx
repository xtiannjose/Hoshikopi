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

/** An Event: date line, photo, title, one line, price (EVT-01). */
export function EventCard({
  event,
  headingLevel = 2,
}: {
  event: Event;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article className="group relative grid content-start gap-3">
      <Photo
        src={event.photoUrl}
        alt={event.photoAlt ?? event.title}
        kind="event"
        sizes="(min-width: 768px) 45vw, 100vw"
        className="rounded-card aspect-16/9"
      />
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
