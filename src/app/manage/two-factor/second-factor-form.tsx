"use client";

import Link from "next/link";
import { useActionState } from "react";

import { busy, Field } from "@/components/fields";

import { secondFactorAction, type SecondFactorState } from "./actions";

export function SecondFactorForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SecondFactorState, FormData>(
    secondFactorAction,
    {}
  );
  return (
    <>
      <form action={action} className="mt-6 grid max-w-xs gap-4">
        <input type="hidden" name="next" value={next} />
        <Field
          name="code"
          label="6-digit code"
          hint="The code changes every 30 seconds."
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          error={state.message}
        />
        <button
          type="submit"
          {...busy(pending)}
          className="bg-primary text-primary-foreground min-h-12 justify-self-start rounded-full px-6 font-semibold aria-disabled:opacity-60"
        >
          {pending ? "Checking..." : "Continue"}
        </button>
      </form>
      {/* The Bar Screen asks for no Second Factor (ADR 0014). */}
      <p className="text-muted-foreground max-w-measure mt-6">
        No phone with you? The Bar Screen doesn&apos;t need a code.{" "}
        <Link href="/bar">Open the Bar Screen</Link>
      </p>
    </>
  );
}
