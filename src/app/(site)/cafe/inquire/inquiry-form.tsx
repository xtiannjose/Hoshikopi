"use client";

import { useActionState } from "react";

import { Field, fieldClass } from "@/components/fields";

import { inquireAction, type InquiryState } from "./actions";

export function InquiryForm({
  kind,
}: {
  kind: "private_event" | "large_order";
}) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(
    inquireAction,
    { status: "idle" }
  );
  if (state.status === "sent") {
    return (
      <p role="status" className="bg-muted rounded-card mt-8 p-6 text-lg">
        Salamat! Your inquiry is with the cafe. We&apos;ll email you back within
        two days.
      </p>
    );
  }
  const value = (name: string) => state.values?.[name];
  const error = (name: string) => state.errors?.[name];
  return (
    <form action={action} className="mt-8 grid max-w-xl gap-5">
      <Field name="kind" label="What is it about?" error={error("kind")}>
        <select
          id="kind"
          name="kind"
          defaultValue={value("kind") ?? kind}
          className={fieldClass}
        >
          <option value="private_event">A private event</option>
          <option value="large_order">An order of more than 15 drinks</option>
        </select>
      </Field>
      <Field
        name="name"
        label="Your name"
        autoComplete="name"
        defaultValue={value("name")}
        error={error("name")}
      />
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={value("email")}
        error={error("email")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          name="wantedOn"
          label="Date (optional)"
          type="date"
          defaultValue={value("wantedOn")}
          error={error("wantedOn")}
        />
        <Field
          name="guests"
          label="Guests or drinks (optional)"
          inputMode="numeric"
          defaultValue={value("guests")}
          error={error("guests")}
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="message" className="font-semibold">
          Tell us about it
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={1000}
          defaultValue={value("message")}
          aria-invalid={error("message") ? true : undefined}
          aria-describedby={error("message") ? "message-error" : undefined}
          className={`${fieldClass} py-2`}
        />
        {error("message") && (
          <p id="message-error" className="text-destructive text-sm">
            {error("message")}
          </p>
        )}
      </div>
      <p className="text-muted-foreground font-mono text-sm">
        Hoshikopi is a concept cafe: an inquiry here reaches a demo inbox, not a
        real cafe.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground min-h-12 rounded-full px-6 font-semibold disabled:opacity-60"
        >
          {pending ? "Sending..." : "Send inquiry"}
        </button>
        <p role="status" className="text-destructive font-semibold">
          {state.status === "error" && state.message}
        </p>
      </div>
    </form>
  );
}
