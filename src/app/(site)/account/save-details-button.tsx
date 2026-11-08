"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { PRIMARY_PILL } from "@/components/panel";

/** Save my details: "Saving..." while the form sends, then a quiet thanks. */
export function SaveDetailsButton() {
  const { pending } = useFormStatus();
  const [wasPending, setWasPending] = useState(pending);
  const [saved, setSaved] = useState(false);
  // Pending turning off means the save landed (React's "previous render" pattern).
  if (pending !== wasPending) {
    setWasPending(pending);
    setSaved(!pending);
  }
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button type="submit" disabled={pending} className={PRIMARY_PILL}>
        {pending ? "Saving..." : "Save my details"}
      </button>
      {/* Always in the page, so screen readers hear the line when it lands. */}
      <p aria-live="polite" className="text-success font-semibold">
        {saved && <span className="animate-rise block">Saved. Salamat!</span>}
      </p>
    </div>
  );
}
