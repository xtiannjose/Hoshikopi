"use client";

import { useFormStatus } from "react-dom";

/** Pay and Fail, both held while the webhook goes through. */
export function PayButtons({ amount }: { amount: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        name="outcome"
        value="pay"
        disabled={pending}
        className="bg-primary text-primary-foreground min-h-14 rounded-full text-lg font-semibold disabled:opacity-60"
      >
        {pending ? "Paying..." : `Pay ${amount}`}
      </button>
      <button
        type="submit"
        name="outcome"
        value="fail"
        disabled={pending}
        className="border-input min-h-12 rounded-full border font-semibold disabled:opacity-60"
      >
        Make the payment fail
      </button>
    </>
  );
}
