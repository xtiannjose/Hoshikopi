"use client";

import Link from "next/link";
import { useActionState } from "react";

import { OUTLINE_PILL, PRIMARY_PILL } from "@/components/panel";

import { answerSignupAction, type AnswerState } from "../../actions";
import { busy } from "@/components/fields";

const CANCEL =
  "border-destructive text-destructive inline-flex min-h-11 items-center rounded-full border px-5 font-semibold";

/** After a cancel, and when the link is opened again later. */
export function CancelledNote() {
  return (
    <div
      role="status"
      className="bg-muted rounded-card grid justify-items-start gap-3 p-5"
    >
      <p className="text-lg">
        Cancelled. Your seats are free for someone else. Salamat for telling us.
      </p>
      <Link href="/events" className={OUTLINE_PILL}>
        See what&apos;s next
      </Link>
    </div>
  );
}

/** Confirm or cancel a Sign-up from its email link (8.7). */
export function SignupAnswer({
  id,
  token,
  slug,
  confirmed,
}: {
  id: string;
  token: string;
  slug: string;
  confirmed: boolean;
}) {
  const [state, action, pending] = useActionState<AnswerState, FormData>(
    answerSignupAction,
    { status: "idle" }
  );
  const status =
    state.status === "idle"
      ? confirmed
        ? "confirmed"
        : "waiting"
      : state.status;

  if (status === "cancelled") return <CancelledNote />;
  if (status === "error") {
    return (
      <div
        role="status"
        className="bg-muted rounded-card grid justify-items-start gap-3 p-5"
      >
        <p className="text-lg">{state.message}</p>
        <Link href={`/events/${slug}`} className={OUTLINE_PILL}>
          Back to the Event
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="bg-muted rounded-card grid gap-4 p-5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="t" value={token} />
      <p role="status" className="text-lg">
        {status === "confirmed"
          ? "You're in! See you there."
          : "One more step: confirm within 30 minutes to keep your seats."}
      </p>
      <div className="flex flex-wrap gap-3">
        {status === "waiting" ? (
          <button
            type="submit"
            name="intent"
            value="confirm"
            {...busy(pending)}
            className={PRIMARY_PILL}
          >
            Confirm my seats
          </button>
        ) : (
          <a
            href={`/events/${slug}/calendar`}
            download={`${slug}.ics`}
            className={OUTLINE_PILL}
          >
            Add to calendar
          </a>
        )}
        <button
          type="submit"
          name="intent"
          value="cancel"
          {...busy(pending)}
          className={CANCEL}
        >
          {status === "waiting" ? "Cancel" : "Cancel my Sign-up"}
        </button>
      </div>
    </form>
  );
}
