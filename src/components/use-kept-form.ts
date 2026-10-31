"use client";

import { startTransition, useEffect, useRef, type FormEvent } from "react";

/**
 * Props for an editor `<form>`. React 19 resets a form after every action,
 * so a refused save lost what was typed; this resets only after a save.
 * `action` stays on the form so it still posts before hydration.
 */
export function useKeptForm(
  dispatch: (data: FormData) => void,
  state: { status: string }
) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "saved") ref.current?.reset();
  }, [state]);
  return {
    ref,
    action: dispatch,
    onSubmit(event: FormEvent<HTMLFormElement>) {
      // A cancelled submit makes React skip its own action and its reset.
      event.preventDefault();
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      const data = new FormData(event.currentTarget, submitter);
      startTransition(() => dispatch(data));
    },
  };
}
