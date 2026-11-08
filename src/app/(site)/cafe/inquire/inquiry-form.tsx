"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";

import { Field, fieldClass } from "@/components/fields";
import { Empty, OUTLINE_PILL } from "@/components/panel";

import { inquireAction, type InquiryState } from "./actions";

export function InquiryForm({
  kind,
  today,
}: {
  kind: "private_event" | "large_order";
  /** The Manila day ("2026-11-07"): no inquiry for a day gone by. */
  today: string;
}) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(
    inquireAction,
    { status: "idle" }
  );
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  // After a refusal, take the Customer to the first field to fix, or to why.
  useEffect(() => {
    if (state.status !== "error") return;
    const invalid = form.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]'
    );
    if (invalid) invalid.focus();
    else status.current?.scrollIntoView({ block: "center" });
  }, [state]);
  if (state.status === "sent") {
    return (
      <Empty icon={<CheckCircleIcon size={24} />}>
        <div>
          <p role="status" className="text-lg">
            Salamat! Your inquiry is with the cafe. We&apos;ll email you back
            within two days.
          </p>
          <p className="text-muted-foreground">
            We&apos;ll reply to <b>{state.email}</b>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/cafe" className={OUTLINE_PILL}>
            Back to Visit
          </Link>
          <Link href="/events" className={OUTLINE_PILL}>
            See upcoming Events
          </Link>
        </div>
      </Empty>
    );
  }
  const value = (name: string) => state.values?.[name];
  const error = (name: string) => state.errors?.[name];
  return (
    <form ref={form} action={action} className="grid max-w-xl gap-5">
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
          min={today}
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
        <p id="message-hint" className="text-muted-foreground text-sm">
          The day, how many, and any drinks or food you have in mind.
        </p>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={1000}
          defaultValue={value("message")}
          aria-invalid={error("message") ? true : undefined}
          aria-describedby={
            error("message") ? "message-hint message-error" : "message-hint"
          }
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
        <p
          ref={status}
          role="status"
          className="text-destructive font-semibold"
        >
          {state.status === "error" && state.message}
        </p>
      </div>
    </form>
  );
}
