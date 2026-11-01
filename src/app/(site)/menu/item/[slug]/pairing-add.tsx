"use client";

import Link from "next/link";
import { useActionState } from "react";

import { addToCartAction, type AddState } from "./actions";

/** One tap adds the Pairing with its default Options (MENU-08). */
export function PairingAdd({
  menuItemId,
  name,
  optionIds,
}: {
  menuItemId: string;
  name: string;
  optionIds: string[];
}) {
  const [state, action, pending] = useActionState<AddState, FormData>(
    addToCartAction,
    { status: "idle" }
  );
  return (
    <form action={action} className="grid justify-items-start gap-1">
      <input type="hidden" name="menuItemId" value={menuItemId} />
      {optionIds.map((id, index) => (
        <input key={id} type="hidden" name={`option-${index}`} value={id} />
      ))}
      <input type="hidden" name="quantity" value="1" />
      <button
        type="submit"
        disabled={pending}
        className="border-input min-h-11 rounded-full border px-5 font-semibold disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add"}
        <span className="sr-only"> {name}</span>
      </button>
      {/* Not role="status": the Option picker above owns that one. */}
      <p aria-live="polite" className="min-h-6 text-sm">
        {state.status === "added" && (
          <>
            Added. <Link href="/cart">See your Cart</Link>
          </>
        )}
        {state.status === "error" && (
          <span className="text-destructive">{state.message}</span>
        )}
      </p>
    </form>
  );
}
