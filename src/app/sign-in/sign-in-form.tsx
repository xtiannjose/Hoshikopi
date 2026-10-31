"use client";

import { useActionState } from "react";

import { requestSignInLink, type SignInState } from "./actions";

const initial: SignInState = { status: "idle" };

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(requestSignInLink, initial);

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-card bg-muted grid gap-2 p-6">
        <h2 className="font-display text-2xl italic">Check your email</h2>
        <p>
          We sent a sign-in link to <b>{state.email}</b>. It works once, for 5
          minutes.
        </p>
      </div>
    );
  }

  const error = state.status === "error" ? state.message : null;
  return (
    <form action={action} className="grid gap-4" noValidate>
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
