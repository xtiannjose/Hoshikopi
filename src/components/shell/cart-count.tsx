"use client";

import { useState } from "react";

/**
 * The Cart count in the header. It bumps each time the count goes up (Add to
 * order, One more), never on load or on the way down; the key restarts the
 * bump. It compares with the last count, not the first (audit motion:7).
 */
export function CartCount({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  const [last, setLast] = useState(count);
  const [up, setUp] = useState(false);
  // React's "previous render" pattern, as in save-details-button.tsx.
  if (count !== last) {
    setLast(count);
    setUp(count > last);
  }
  return (
    <span
      key={count}
      className={`inline-block empty:hidden ${up ? "animate-bump" : ""}`}
    >
      {children}
    </span>
  );
}
