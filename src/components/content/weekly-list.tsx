import { formatClock } from "@/lib/hours";
import type { RecurringEventView } from "@/modules/content";

const DAYS = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

/** "Thursdays, 7:00 PM to 9:00 PM" */
export function weeklyWhen(event: RecurringEventView): string {
  return `${DAYS[event.weekday]}, ${formatClock(event.startsAt)} to ${formatClock(event.endsAt)}`;
}

/** Recurring Events as a weekly list, apart from dated Events (EVT-03). */
export function WeeklyList({
  events,
  className = "",
}: {
  events: RecurringEventView[];
  className?: string;
}) {
  if (events.length === 0) return null;
  return (
    <section aria-labelledby="weekly" className={className}>
      <h2 id="weekly" className="font-display pb-1 text-3xl italic">
        Every week
      </h2>
      <p className="text-muted-foreground mt-1">
        No booking needed. Just come by.
      </p>
      <ul className="border-border mt-4 border-t">
        {events.map((event) => (
          <li
            key={event.id}
            className="border-border grid gap-1 border-b py-3 sm:grid-cols-[1fr_auto] sm:gap-x-6"
          >
            <span className="font-semibold">{event.title}</span>
            <span className="font-mono text-sm sm:text-right">
              {weeklyWhen(event)}
            </span>
            {event.note && (
              <span className="text-muted-foreground sm:col-span-2">
                {event.note}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
