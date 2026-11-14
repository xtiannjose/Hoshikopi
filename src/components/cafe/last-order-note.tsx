"use client";

import { useEffect, useState } from "react";

import { now } from "@/lib/clock";
import { afterLastOrder, openState, type Hours } from "@/lib/hours";

/**
 * "Last order in 25 min" in the hour before Last Order; after it, when to
 * walk in and when ordering opens again (ORD-13). Reads the clock in the
 * browser.
 */
export function LastOrderNote({ hours }: { hours: Hours }) {
  const [at, setAt] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setAt(now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  if (!at) return null;
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
