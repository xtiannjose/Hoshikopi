"use client";

import { useActionState, useState } from "react";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";

import { Empty, OUTLINE_PILL } from "@/components/panel";
import { useFocusInvalid } from "@/components/use-focus-invalid";

import { requestSignInLink, type SignInState } from "./actions";

const initial: SignInState = { status: "idle" };

/** A new key starts the form over, for "Use a different email". */
export function SignInForm({ next }: { next: string }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <EmailForm
      key={attempt}
      next={next}
      again={attempt > 0}
      onReset={() => setAttempt((n) => n + 1)}
    />
  );
}

function EmailForm({
  next,
  again,
  onReset,
}: {
  next: string;
  again: boolean;
  onReset: () => void;
}) {
  const [state, action, pending] = useActionState(requestSignInLink, initial);
  // The email field carries the error, so focusing it reads it out.
  const { form } = useFocusInvalid(state.status === "error", state);

  if (state.status === "sent") {
    return (
      <Empty icon={<EnvelopeSimpleIcon size={24} />}>
        <div role="status" className="grid gap-2">
          <h2 className="font-display text-2xl italic">Check your email</h2>
          <p>
            We sent a sign-in link to <b>{state.email}</b>. It works once, for 5
            minutes.
          </p>
          <p className="text-muted-foreground text-sm">
            Not there in a minute? Check Spam or Promotions.
          </p>
        </div>
        <button type="button" onClick={onReset} className={OUTLINE_PILL}>
          Use a different email
        </button>
      </Empty>
    );
  }

  const error = state.status === "error" ? state.message : null;
  return (
    <form ref={form} action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-2">
        <label htmlFor="email" className="font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          // Back from "Use a different email": the button that had focus is gone.
          autoFocus={again}
          defaultValue={state.status === "error" ? state.email : ""}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "email-error" : undefined}
          className="rounded-card border-input bg-background min-h-12 border px-4"
        />
        {error && (
          <p id="email-error" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground min-h-12 rounded-full px-6 font-semibold disabled:opacity-60"
      >
        {pending ? "Sending..." : "Email me a link"}
      </button>
    </form>
  );
}
