import { now } from "@/lib/clock";

// An iCalendar file (RFC 5545) for one Event (EVT-04): Google, Apple and
// Outlook calendars all read it.

const stamp = (at: Date) =>
  at
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** Text values escape backslash, semicolon, comma and line breaks. */
const text = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

/**
 * Lines longer than 75 characters fold onto lines that start with a space.
 * shortcut: counts characters, not UTF-8 octets; fine for our mostly ASCII
 * text, count bytes if titles turn to emoji or long non-Latin text.
 */
function fold(line: string): string {
  const parts = [line.slice(0, 75)];
  for (let at = 75; at < line.length; at += 74) {
    parts.push(` ${line.slice(at, at + 74)}`);
  }
  return parts.join("\r\n");
}

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
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hoshikopi//Concept cafe//EN",
    "BEGIN:VEVENT",
    `UID:${event.slug}@hoshikopi`,
    `DTSTAMP:${stamp(now())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(event.endsAt)}`,
    `SUMMARY:${text(event.title)}`,
    `DESCRIPTION:${text(`${event.summary} (Hoshikopi is a concept cafe.)`)}`,
    `LOCATION:${text("Hoshikopi, Kapitolyo, Pasig")}`,
    `URL:${siteUrl}/events/${event.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
