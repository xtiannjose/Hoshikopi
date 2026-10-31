// The only place that reads "now" (CLAUDE.md). Store UTC, define and show
// hours in Asia/Manila, which is UTC+8 all year (no daylight saving).

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

let frozen: Date | null = null;

export function now(): Date {
  return frozen ? new Date(frozen) : new Date();
}

/** Tests only: pin "now" to an instant. */
export function freezeClock(at: Date | string): void {
  frozen = new Date(at);
}

export function unfreezeClock(): void {
  frozen = null;
}

/** The Manila calendar day ("2026-11-02"), weekday (0 Sunday) and minute of the day. */
export function manila(at: Date): {
  day: string;
  weekday: number;
  minutes: number;
} {
  const local = new Date(at.getTime() + MANILA_OFFSET_MS);
  return {
    day: local.toISOString().slice(0, 10),
    weekday: local.getUTCDay(),
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

/** The instant of `minutes` after midnight on a Manila `day` ("2026-11-02"). */
export function manilaInstant(day: string, minutes: number): Date {
  return new Date(
    Date.parse(`${day}T00:00:00Z`) + minutes * 60_000 - MANILA_OFFSET_MS
  );
}

/** A Manila day as the Date Prisma reads and writes for `date` columns. */
export function dayValue(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
});
const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** "9:15 AM" in Manila time (docs/05-DESIGN-SYSTEM.md section 8). */
export function formatTime(at: Date): string {
  return timeFormat.format(at).replace(/ /g, " ");
}

/** "Sat, Nov 7" in Manila time. */
export function formatDate(at: Date): string {
  return dateFormat.format(at);
}
