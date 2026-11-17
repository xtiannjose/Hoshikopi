// Opening Hours and Special Hours as plain data (Manila wall-clock "HH:MM"),
// so both the server and the "open now" island can use them. No database.
import { dayOf, dayValue, formatDay, manila } from "./clock";

export type DayHours = {
  opensAt: string;
  lastOrderAt: string;
  closesAt: string;
  note?: string | null;
};

export type Hours = {
  weekly: {
    weekday: number;
    opensAt: string;
    lastOrderAt: string;
    closesAt: string;
    isClosed: boolean;
  }[];
  /** Upcoming Special Hours by Manila day ("2026-11-01"). */
  special: {
    day: string;
    isClosed: boolean;
    opensAt?: string | null;
    lastOrderAt?: string | null;
    closesAt?: string | null;
    note?: string | null;
  }[];
};

export type OpenState =
  | {
      open: true;
      closesAt: string;
      lastOrderAt: string;
      /** Negative once Last Order has passed. */
      minutesToLastOrder: number;
    }
  | { open: false; opensAt: string; opensDay: string }
  | { open: false; opensAt: null; opensDay: null };

/** "07:30" -> 450. */
export const toMinutes = (hhmm: string) =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** "20:30" -> "8:30 PM". */
export function formatClock(hhmm: string): string {
  const minutes = toMinutes(hhmm);
  const hour = Math.floor(minutes / 60);
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${String(minutes % 60).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

/** "2026-11-01" plus `days`. */
export function addDays(day: string, days: number): string {
  const date = dayValue(day);
  date.setUTCDate(date.getUTCDate() + days);
  return dayOf(date);
}

const weekdayOf = (day: string) => dayValue(day).getUTCDay();

/** The hours on a Manila day, Special Hours first; null when closed. */
export function hoursOn(day: string, hours: Hours): DayHours | null {
  const special = hours.special.find((s) => s.day === day);
  if (special) {
    if (
      special.isClosed ||
      !special.opensAt ||
      !special.lastOrderAt ||
      !special.closesAt
    ) {
      return null;
    }
    return {
      opensAt: special.opensAt,
      lastOrderAt: special.lastOrderAt,
      closesAt: special.closesAt,
      note: special.note,
    };
  }
  const weekly = hours.weekly.find((w) => w.weekday === weekdayOf(day));
  if (!weekly || weekly.isClosed) return null;
  return {
    opensAt: weekly.opensAt,
    lastOrderAt: weekly.lastOrderAt,
    closesAt: weekly.closesAt,
  };
}

/** Open now, or when it opens next (looks two weeks ahead). */
export function openState(at: Date, hours: Hours): OpenState {
  const { day, minutes } = manila(at);
  const today = hoursOn(day, hours);
  if (
    today &&
    minutes >= toMinutes(today.opensAt) &&
    minutes < toMinutes(today.closesAt)
  ) {
    return {
      open: true,
      closesAt: today.closesAt,
      lastOrderAt: today.lastOrderAt,
      minutesToLastOrder: toMinutes(today.lastOrderAt) - minutes,
    };
  }
  for (let ahead = 0; ahead <= 14; ahead++) {
    const next = addDays(day, ahead);
    const h = hoursOn(next, hours);
    if (!h) continue;
    if (ahead === 0 && minutes >= toMinutes(h.opensAt)) continue;
    return { open: false, opensAt: h.opensAt, opensDay: next };
  }
  return { open: false, opensAt: null, opensDay: null };
}

/** "today", "tomorrow" or "on Sat, Dec 26": a Manila day seen from `today`. */
export function dayWord(day: string, today: string): string {
  if (day === today) return "today";
  if (day === addDays(today, 1)) return "tomorrow";
  return `on ${formatDay(day)}`;
}

/**
 * Between Last Order and closing the cafe is open for walk-ins: say so, and
 * when ordering opens again (ORD-13, audit journeys:16). Null at any other
 * time.
 */
export function afterLastOrder(at: Date, hours: Hours): string | null {
  const state = openState(at, hours);
  if (!state.open || state.minutesToLastOrder > 0) return null;
  const today = manila(at).day;
  const walkIn = `Last orders were at ${formatClock(state.lastOrderAt)}. Walk in until ${formatClock(state.closesAt)}`;
  for (let ahead = 1; ahead <= 14; ahead++) {
    const day = addDays(today, ahead);
    const next = hoursOn(day, hours);
    if (next) {
      return `${walkIn}, or order ahead from ${formatClock(next.opensAt)} ${dayWord(day, today)}.`;
    }
  }
  return `${walkIn}.`;
}

const WEEKDAYS = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

/**
 * What the "open now" badge says before it reads the clock, and all a
 * crawler or a browser without JavaScript sees: true every week, from the
 * weekly hours alone. It said "Open every day." even with a day closed
 * (audit DC-26).
 */
export function weeklySummary(hours: Hours): string {
  const closed = hours.weekly
    .filter((day) => day.isClosed)
    .map((day) => WEEKDAYS[day.weekday]);
  if (closed.length === 0) return "Open every day.";
  if (closed.length === 7) return "Closed for now.";
  const last = closed.pop();
  return `Closed on ${closed.length ? `${closed.join(", ")} and ${last}` : last}.`;
}
