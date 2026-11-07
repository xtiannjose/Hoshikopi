"use client";

import { useState } from "react";

/**
 * The Cart count in the header. It bumps when the count goes up after the
 * page loaded (Add to order), never on load; the key restarts the bump.
 */
export function CartCount({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  const [onLoad] = useState(count);
  return (
    <span
      key={count}
      className={`inline-block empty:hidden ${count > onLoad ? "animate-bump" : ""}`}
    >
      {children}
    </span>
  );
}
