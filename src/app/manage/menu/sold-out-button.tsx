"use client";

import { useFormStatus } from "react-dom";

/** Sold out or Back on inside its form; busy while the change saves. */
export function SoldOutButton({
  name,
  soldOut,
}: {
  name: string;
  soldOut: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold disabled:opacity-60 ${soldOut ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-muted"}`}
    >
      {soldOut ? "Back on" : "Sold out"}
      <span className="sr-only"> for {name}</span>
    </button>
  );
}
