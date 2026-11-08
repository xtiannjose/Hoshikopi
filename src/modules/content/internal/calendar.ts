import { calendarFile } from "@/lib/calendar";

/** One Event as a calendar file (EVT-04). */
export function eventCalendar(
  event: {
    slug: string;
    title: string;
    summary: string;
    startsAt: Date;
    endsAt: Date;
  },
  siteUrl: string
): string {
  return calendarFile({
    uid: `${event.slug}@hoshikopi`,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    summary: event.title,
    description: `${event.summary} (Hoshikopi is a concept cafe.)`,
    location: "Hoshikopi, Kapitolyo, Pasig",
    url: `${siteUrl}/events/${event.slug}`,
  });
}
