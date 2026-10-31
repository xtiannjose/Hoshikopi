"use client";

import { useActionState } from "react";

import { Field } from "@/components/fields";

import { placeOrderAction, type CheckoutState } from "./actions";

export type WindowChoice = { value: string; label: string };

const PAYMENTS = [
  {
    value: "gcash",
    label: "GCash",
    note: "Pay now on a Test Mode checkout.",
  },
  { value: "maya", label: "Maya", note: "Pay now on a Test Mode checkout." },
  {
    value: "card",
    label: "Card",
    note: "Visa or Mastercard, on a Test Mode checkout.",
  },
  {
    value: "pay_at_pickup",
    label: "Pay at Pickup",
    note: "Pay at the counter when you collect.",
  },
] as const;

/** Pickup Time, contact details and Payment Method (ORD-03, ORD-05, PAY-02). */
export function CheckoutForm({
  asap,
  windows,
  totalCents,
  totalText,
  payAtPickupAllowed,
  member,
}: {
  payAtPickupAllowed: boolean;
  /** A signed-in Member is prefilled and collects Stars (ORD-05). */
  member: { name: string; email: string } | null;
  asap: WindowChoice | null;
  windows: WindowChoice[];
  totalCents: number;
  totalText: string;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    placeOrderAction,
    {}
  );
  const error = (name: string) => state.errors?.[name];
  return (
    <form action={action} className="grid gap-8">
      <input type="hidden" name="seenTotalCents" value={totalCents} />
      <fieldset>
        <legend className="font-display text-2xl italic">Pickup Time</legend>
        <div className="mt-4 grid gap-3">
          {asap && (
            <label className="border-input has-[:checked]:border-primary has-[:checked]:bg-muted has-[:focus-visible]:outline-ring rounded-card flex min-h-14 cursor-pointer items-center gap-3 border px-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
              <input
                type="radio"
                name="pickup"
                value="asap"
                defaultChecked
                className="size-5"
              />
              <span>
                <span className="font-semibold">As soon as possible</span>
                <span className="text-muted-foreground block text-sm">
                  {asap.label}
                </span>
              </span>
            </label>
          )}
          {windows.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-sm">
                Or choose a time today
              </p>
              <div className="flex flex-wrap gap-2">
                {windows.map((w) => (
                  <label
                    key={w.value}
                    className="border-input has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary has-[:focus-visible]:outline-ring inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 font-mono text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                  >
                    <input
                      type="radio"
                      name="pickup"
                      value={w.value}
                      className="sr-only"
                    />
                    {w.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="font-display mb-2 text-2xl italic">
          Who&apos;s picking up
        </legend>
        <Field
          name="customerName"
          defaultValue={state.values?.customerName ?? member?.name}
          label="Name"
          autoComplete="given-name"
          error={error("customerName")}
        />
        <p className="text-muted-foreground -mb-2 text-sm">
          An email or a mobile number, so we can reach you about your Order.
        </p>
        <Field
          name="customerEmail"
          defaultValue={state.values?.customerEmail ?? member?.email}
          label="Email"
          type="email"
          autoComplete="email"
          error={error("customerEmail")}
        />
        <Field
          name="customerPhone"
          defaultValue={state.values?.customerPhone}
          label="Mobile number"
          type="tel"
          autoComplete="tel"
          placeholder="0917 123 4567"
          error={error("customerPhone")}
        />
      </fieldset>

      <fieldset>
        <legend className="font-display text-2xl italic">Payment</legend>
        <div className="mt-4 grid gap-3">
          {PAYMENTS.filter(
            (p) => p.value !== "pay_at_pickup" || payAtPickupAllowed
          ).map((p, index) => (
            <label
              key={p.value}
              className="border-input has-[:checked]:border-primary has-[:checked]:bg-muted has-[:focus-visible]:outline-ring rounded-card flex min-h-14 cursor-pointer items-center gap-3 border px-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={p.value}
                defaultChecked={index === 0}
                className="size-5"
              />
              <span className="flex-1">
                <span className="font-semibold">{p.label}</span>
                <span className="text-muted-foreground block text-sm">
                  {p.note}
                </span>
              </span>
              {p.value !== "pay_at_pickup" && (
                <span className="border-warning text-warning rounded-full border px-2 py-0.5 text-xs font-semibold">
                  Test Mode
                </span>
              )}
            </label>
          ))}
        </div>
        {!payAtPickupAllowed && (
          <p className="text-muted-foreground mt-3 text-sm">
            Guests can pay at pickup for up to 4 drinks; pay online for more.
          </p>
        )}
      </fieldset>

      <div className="grid gap-3">
        <p role="status" className="min-h-6 font-semibold">
          {state.message && (
            <span className="text-destructive">{state.message}</span>
          )}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground min-h-14 rounded-full px-8 text-lg font-semibold transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Placing your order..." : `Place order, ${totalText}`}
        </button>
      </div>
    </form>
  );
}
