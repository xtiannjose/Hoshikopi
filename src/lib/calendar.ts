import { now } from "./clock";

// An iCalendar file (RFC 5545) with one event: Google, Apple and Outlook
// calendars all read it. Events (EVT-04) and Scheduled Pickups use it.

export type CalendarEntry = {
  uid: string;
  startsAt: Date;
  endsAt: Date;
  summary: string;
  description: string;
  location: string;
  url: string;
};

const stamp = (at: Date) =>
  at
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/**
 * Text values escape backslash, semicolon, comma and every line break (a
 * lone CR too); other control characters are not allowed, so they go (the
 * tab stays).
 */
const text = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "");

const encoder = new TextEncoder();

/**
 * Lines longer than 75 bytes fold onto lines that start with a space,
 * between characters, never inside one.
 */
function fold(line: string): string {
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      parts.push(current);
      current = " ";
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n");
}

export function calendarFile(entry: CalendarEntry): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hoshikopi//Concept cafe//EN",
    "BEGIN:VEVENT",
    `UID:${entry.uid}`,
    `DTSTAMP:${stamp(now())}`,
    `DTSTART:${stamp(entry.startsAt)}`,
    `DTEND:${stamp(entry.endsAt)}`,
    `SUMMARY:${text(entry.summary)}`,
    `DESCRIPTION:${text(entry.description)}`,
    `LOCATION:${text(entry.location)}`,
    `URL:${entry.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
