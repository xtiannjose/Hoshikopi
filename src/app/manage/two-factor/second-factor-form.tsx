"use client";

import { useActionState } from "react";

import { Field } from "@/components/fields";

import { secondFactorAction, type SecondFactorState } from "./actions";

export function SecondFactorForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SecondFactorState, FormData>(
    secondFactorAction,
    {}
  );
  return (
    <form action={action} className="mt-6 grid max-w-xs gap-4">
      <input type="hidden" name="next" value={next} />
      <Field
        name="code"
        label="6-digit code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]{6,7}"
        maxLength={7}
        required
        error={state.message}
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground min-h-12 justify-self-start rounded-full px-6 font-semibold disabled:opacity-60"
      >
        {pending ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}
