"use client";

import { useEffect, useRef } from "react";

import { now } from "@/lib/clock";
import { STARTED_FIELD, TRAP_FIELD } from "@/lib/bot-check";

/**
 * The hidden fields botCheck reads (audit SEC1-06): a trap field people
 * never see, and when the form opened, set in the browser after the page
 * loads and kept when React resets the form after a refusal.
 */
export function BotFields() {
  const started = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = started.current;
    if (!input) return undefined;
    const at = String(now().getTime());
    input.value = at;
    const keep = () => setTimeout(() => (input.value = at));
    input.form?.addEventListener("reset", keep);
    return () => input.form?.removeEventListener("reset", keep);
  }, []);
  return (
    <>
      <input ref={started} type="hidden" name={STARTED_FIELD} />
      <div
        aria-hidden
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label>
          Leave this empty
          <input
            type="text"
            name={TRAP_FIELD}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>
    </>
  );
}
