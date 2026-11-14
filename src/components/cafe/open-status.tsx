"use client";

import { useEffect, useState } from "react";

import { manila, now } from "@/lib/clock";
import { dayWord, formatClock, openState, type Hours } from "@/lib/hours";

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
  const when = dayWord(state.opensDay, manila(at).day);
  return (
    <span>
      <span className="font-semibold">Closed now</span>, opens{" "}
      {formatClock(state.opensAt)} {when}
    </span>
  );
}
