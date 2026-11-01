"use client";

import { useActionState } from "react";

import { Field, fieldClass } from "@/components/fields";

import { signUpAction, type SignupState } from "./actions";

/** Sign up for an Event with Seats (EVT-02). */
export function SignupForm({
  slug,
  seatsLeft,
  price,
}: {
  slug: string;
  seatsLeft: number;
  price: string | null;
}) {
  const [state, action, pending] = useActionState<SignupState, FormData>(
    signUpAction,
    { status: "idle" }
  );
  if (state.status === "done") {
    return (
      <p role="status" className="bg-muted rounded-card mt-4 p-4 text-lg">
        You&apos;re in! We emailed {state.email} with the details.
      </p>
    );
  }
  const error = (name: string) => state.errors?.[name];
  return (
    <form action={action} className="mt-4 grid max-w-md gap-4">
      <input type="hidden" name="slug" value={slug} />
      <Field
        name="name"
        label="Your name"
        autoComplete="name"
        defaultValue={state.values?.name}
        error={error("name")}
      />
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={error("email")}
      />
      <Field name="seats" label="Seats" error={error("seats")}>
        <select
          id="seats"
          name="seats"
          defaultValue={state.values?.seats ?? "1"}
          className={fieldClass}
        >
          {Array.from({ length: Math.min(4, seatsLeft) }, (_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </Field>
      {price && (
        <p className="text-muted-foreground">Pay {price} a seat at the door.</p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground min-h-12 rounded-full px-6 font-semibold disabled:opacity-60"
        >
          {pending ? "Signing up..." : "Sign up"}
        </button>
        <p role="status" className="text-destructive font-semibold">
          {state.status === "error" && state.message}
        </p>
      </div>
    </form>
  );
}
