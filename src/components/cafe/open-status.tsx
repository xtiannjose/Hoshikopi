"use client";

import { useEffect, useState } from "react";

import { formatDate, manila, now } from "@/lib/clock";
import { addDays, formatClock, openState, type Hours } from "@/lib/hours";

/**
 * "Open now, closes 9:00 PM": reads the clock in the browser, so the page
 * around it stays prerendered (docs/03 section 4). Until it mounts it shows
 * `fallback`.
 */
export function OpenStatus({
  hours,
  fallback,
}: {
  hours: Hours;
  fallback: string;
}) {
  const [at, setAt] = useState<Date | null>(null);
  useEffect(() => {
    // The first tick runs at once; later ones keep the badge current.
    const tick = () => setAt(now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  if (!at) return <span>{fallback}</span>;
  const state = openState(at, hours);
  if (state.open) {
    return (
      <span>
        <span className="text-success font-semibold">Open now</span>, closes{" "}
        {formatClock(state.closesAt)}
      </span>
    );
  }
  if (!state.opensAt) return <span>Closed for now</span>;
  const today = manila(at).day;
  const when =
    state.opensDay === today
      ? "today"
      : state.opensDay === addDays(today, 1)
        ? "tomorrow"
        : `on ${formatDate(new Date(`${state.opensDay}T04:00:00Z`))}`;
  return (
    <span>
      <span className="font-semibold">Closed now</span>, opens{" "}
      {formatClock(state.opensAt)} {when}
    </span>
  );
}
