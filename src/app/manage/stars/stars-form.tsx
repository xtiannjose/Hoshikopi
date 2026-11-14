"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";

import { Field, fieldClass } from "@/components/fields";
import { OUTLINE_PILL, PRIMARY_PILL } from "@/components/panel";

import { adjustStarsAction, type StarsState } from "./actions";

export function StarsForm() {
  const [state, action, pending] = useActionState<StarsState, FormData>(
    adjustStarsAction,
    {}
  );
  const email = useRef<HTMLInputElement>(null);
  return (
    <form action={action} className="grid gap-5">
      {/* Own inputs for the ref and the number limits; the refusal names
          the field, which Field marks invalid. */}
      <Field
        name="email"
        label="Member's email"
        aria-invalid={state.field === "email" || undefined}
      >
        {(control) => (
          <input
            ref={email}
            {...control}
            type="email"
            required
            autoComplete="off"
            defaultValue={state.values?.email}
            className={fieldClass}
          />
        )}
      </Field>
      <Field
        name="stars"
        label="Stars to add (use a minus to remove)"
        hint="Nine Stars make a free drink. Up to 50 at a time."
        aria-invalid={state.field === "stars" || undefined}
      >
        {(control) => (
          <input
            {...control}
            type="number"
            min={-50}
            max={50}
            required
            defaultValue={state.values?.stars}
            className={fieldClass}
          />
        )}
      </Field>
      <Field
        name="reason"
        label="Reason"
        hint="The Member sees this in their Star history, so write it for them. For example: Sorry about the wait, a Star on us."
        required
        maxLength={120}
        defaultValue={state.values?.reason}
      />
      <button
        type="submit"
        disabled={pending}
        className={`${PRIMARY_PILL} min-h-12 justify-self-start px-6`}
      >
        {pending ? "Saving..." : "Save adjustment"}
      </button>
      <p role="status" className="font-semibold">
        {state.message && (
          <span className={state.ok ? "" : "text-destructive"}>
            {state.message}
          </span>
        )}
      </p>
      {state.ok && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={() => email.current?.focus()}
            className={OUTLINE_PILL}
          >
            Adjust another Member
          </button>
          <Link href="/manage/reports">See Reports</Link>
        </div>
      )}
    </form>
  );
}
