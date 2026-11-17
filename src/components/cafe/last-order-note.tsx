"use client";

import { useEffect, useState } from "react";

import { now } from "@/lib/clock";
import { afterLastOrder, openState, type Hours } from "@/lib/hours";

/**
 * "Last order in 25 min" in the hour before Last Order; after it, when to
 * walk in and when ordering opens again (ORD-13). Reads the clock in the
 * browser.
 */
export function LastOrderNote({
  hours,
  at: first,
}: {
  hours: Hours;
  /** The server's time, so the note is there from the first paint (DC-25). */
  at: string;
}) {
  const [at, setAt] = useState(() => new Date(first));
  useEffect(() => {
    const timer = setInterval(() => setAt(now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const state = openState(at, hours);
  if (!state.open || state.minutesToLastOrder > 60) return null;
  return (
    <p className="text-warning font-semibold">
      {state.minutesToLastOrder > 0
        ? `Last order in ${state.minutesToLastOrder} min.`
        : afterLastOrder(at, hours)}
    </p>
  );
}
