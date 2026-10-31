"use client";

import { useActionState } from "react";

import { Field } from "@/components/fields";

import { adjustStarsAction, type StarsState } from "./actions";

export function StarsForm() {
  const [state, action, pending] = useActionState<StarsState, FormData>(
    adjustStarsAction,
    {}
  );
  return (
    <form action={action} className="mt-6 grid max-w-xl gap-4">
      <Field
        name="email"
        label="Member's email"
        type="email"
        required
        defaultValue={state.values?.email}
      />
      <Field
        name="stars"
        label="Stars to add (use a minus to remove)"
        type="number"
        min={-50}
        max={50}
        required
        defaultValue={state.values?.stars}
      />
      <Field
        name="reason"
        label="Reason"
        required
        maxLength={120}
        defaultValue={state.values?.reason}
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground min-h-12 justify-self-start rounded-full px-6 font-semibold disabled:opacity-60"
      >
        Save
      </button>
      <p role="status" className="font-semibold">
        {state.message && (
          <span className={state.ok ? "" : "text-destructive"}>
            {state.message}
          </span>
        )}
      </p>
    </form>
  );
}
