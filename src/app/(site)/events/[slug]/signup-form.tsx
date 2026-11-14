"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { Field, fieldClass } from "@/components/fields";
import { useFocusInvalid } from "@/components/use-focus-invalid";
import { now } from "@/lib/clock";

import { signUpAction, type SignupState } from "./actions";

/** Sign up for an Event with Seats (EVT-02). Closes itself once the Event
 * starts: the page stays prerendered, so the browser reads the clock. */
export function SignupForm({
  slug,
  seatsLeft,
  price,
  startsAt,
  calendar,
  directions,
}: {
  slug: string;
  seatsLeft: number;
  price: string | null;
  /** ISO time the Event starts. */
  startsAt: string;
  /** The Event's .ics file and the cafe's maps link. */
  calendar: string;
  directions: string;
}) {
  const [state, action, pending] = useActionState<SignupState, FormData>(
    signUpAction,
    { status: "idle" }
  );
  const { form, status } = useFocusInvalid(state.status === "error", state);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    // The first tick runs at once; later ones catch the start while open.
    const start = new Date(startsAt).getTime();
    const tick = () => setStarted(now().getTime() >= start);
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [startsAt]);
  if (state.status === "done") {
    return (
      <div role="status" className="bg-background rounded-card mt-4 p-4">
        <p className="text-lg">
          {!state.confirmed
            ? `Almost there! We emailed ${state.email} a link. Open it within 30 minutes to keep your seats.`
            : state.emailed === false
              ? "You're in! See you there. This demo sends no emails, so there's no cancel link to keep."
              : "You're in! See you there. The link in your email cancels it if plans change."}
        </p>
        <p className="mt-2 flex flex-wrap gap-x-6">
          <a
            href={calendar}
            download={`${slug}.ics`}
            className="inline-flex min-h-11 items-center"
          >
            Add it to your calendar
          </a>
          <a href={directions} className="inline-flex min-h-11 items-center">
            Get directions
          </a>
        </p>
      </div>
    );
  }
  if (started) {
    return (
      <p className="bg-background rounded-card mt-4 p-4 text-lg">
        Sign-up closed when we started. Walk in and watch, or{" "}
        <Link href="/events">see what&apos;s next</Link>.
      </p>
    );
  }
  const error = (name: string) => state.errors?.[name];
  return (
    <form ref={form} action={action} className="mt-4 grid max-w-md gap-4">
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
