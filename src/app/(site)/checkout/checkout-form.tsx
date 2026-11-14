"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type ReactNode } from "react";
import { ClockIcon, UserIcon, WalletIcon } from "@phosphor-icons/react";

import { formatPrice } from "@/lib/money";

import { Field, fieldClass } from "@/components/fields";
import { IconCircle } from "@/components/panel";
import { useFocusInvalid } from "@/components/use-focus-invalid";

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

const FIELDSET = "rounded-card border-border border p-5 md:p-6";

/** The next Pickup Times as chips; the rest go in the Later today list. */
const CHIPS = 6;

/** "1:15 PM" belongs to "1 PM". */
const hourOf = (label: string) => label.replace(/:\d\d/, "");

function byHour(windows: WindowChoice[]) {
  const groups: { hour: string; windows: WindowChoice[] }[] = [];
  for (const w of windows) {
    const hour = hourOf(w.label);
    if (groups.at(-1)?.hour !== hour) groups.push({ hour, windows: [] });
    groups.at(-1)!.windows.push(w);
  }
  return groups;
}

// input:checked, not :checked, which also matches the chosen <option>.
const CHOICE =
  "border-input has-[input:checked]:border-primary has-[input:checked]:bg-muted has-[:focus-visible]:outline-ring rounded-card flex min-h-14 cursor-pointer items-center gap-3 border px-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2";

/** A step's legend: icon, name, and "1 of 3" kept out of the group's name. */
function Legend({
  icon,
  step,
  children,
}: {
  icon: ReactNode;
  step: number;
  children: ReactNode;
}) {
  return (
    <legend className="float-left mb-4 flex w-full items-center gap-3">
      <IconCircle>{icon}</IconCircle>
      <span className="font-display text-2xl italic">{children}</span>
      <span
        aria-hidden
        className="text-muted-foreground ml-auto font-mono text-sm"
      >
        {step} of 3
      </span>
    </legend>
  );
}

/** Pickup Time, contact details and Payment Method (ORD-03, ORD-05, PAY-02). */
export function CheckoutForm({
  asap,
  windows,
  totalCents,
  totalText,
  payAtPickupAllowed,
  member,
  reward,
}: {
  /** A free drink for 9 Stars, when the Member has them (LOY-03). */
  reward: { name: string; discountCents: number } | null;
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
  const { form, status } = useFocusInvalid(
    Boolean(state.message || state.errors),
    state
  );
  const error = (name: string) => state.errors?.[name];
  // Neither an email nor a mobile number: the refusal is for both fields
  // (audit a11y:11). The server files it under customerEmail.
  const noContact =
    !!error("customerEmail") &&
    !state.values?.customerEmail.trim() &&
    !state.values?.customerPhone.trim();
  const contact = {
    "aria-describedby": noContact
      ? "contact-rule contact-error"
      : "contact-rule",
    "aria-invalid": noContact || undefined,
  } as const;
  // After a refusal React resets the form, so the choices come back from the
  // action; one no longer offered falls back to the first.
  const keptPickup = state.values?.pickup;
  const pickupKept = windows.some((w) => w.value === keptPickup);
  const chips = windows.slice(0, CHIPS);
  const later = windows.slice(CHIPS);
  const keptLater = later.some((w) => w.value === keptPickup);
  const laterRadio = useRef<HTMLInputElement>(null);
  const payments = PAYMENTS.filter(
    (p) => p.value !== "pay_at_pickup" || payAtPickupAllowed
  );
  const keptPayment = payments.some(
    (p) => p.value === state.values?.paymentMethod
  )
    ? state.values?.paymentMethod
    : payments[0]?.value;
  const [useReward, setUseReward] = useState(false);
  const total = totalCents - (useReward && reward ? reward.discountCents : 0);
  return (
    <form ref={form} action={action} className="grid gap-8">
      <input type="hidden" name="seenTotalCents" value={total} />
      {reward && (
        <label className="border-star bg-muted rounded-card flex min-h-14 cursor-pointer items-center gap-3 border px-4 py-3">
          <input
            type="checkbox"
            name="useReward"
            checked={useReward}
            onChange={(event) => setUseReward(event.target.checked)}
            className="size-5"
          />
          <span>
            <span className="font-semibold">
              Use 9 Stars for a free {reward.name}
            </span>
            <span className="text-muted-foreground block text-sm">
              Saves {formatPrice(reward.discountCents)}; options still add their
              price.
            </span>
          </span>
        </label>
      )}
      <fieldset className={FIELDSET}>
        <Legend icon={<ClockIcon size={20} />} step={1}>
          Pickup Time
        </Legend>
        <div className="clear-both grid gap-3">
          {asap && (
            <label className={CHOICE}>
              <input
                type="radio"
                name="pickup"
                value="asap"
                defaultChecked={!pickupKept}
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
          {chips.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-2 text-sm">
                Or choose a time today
              </p>
              {/* Even widths, so the rows line up (UI2-08). */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(5.75rem,1fr))] gap-2">
                {chips.map((w) => (
                  <label
                    key={w.value}
                    className="border-input has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary has-[:focus-visible]:outline-ring inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border px-3 font-mono text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                  >
                    <input
                      type="radio"
                      name="pickup"
                      value={w.value}
                      defaultChecked={w.value === keptPickup}
                      className="sr-only"
                    />
                    {w.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          {later.length > 0 && (
            // The rest of the day in one native list, by hour, instead of a
            // wall of chips (UI2-08); choosing a time picks this row.
            <div className={`${CHOICE} flex-wrap py-2`}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  ref={laterRadio}
                  type="radio"
                  name="pickup"
                  value="later"
                  defaultChecked={keptLater}
                  className="size-5"
                />
                <span className="font-semibold">Later today</span>
              </label>
              <select
                // React applies a select's defaultValue only on mount, so
                // after a refusal the form reset brought back the first
                // time; a new key mounts it with the kept one.
                key={keptLater ? keptPickup : "first"}
                name="pickupLater"
                aria-label="Time later today"
                defaultValue={keptLater ? keptPickup : later[0].value}
                onChange={() => {
                  if (laterRadio.current) laterRadio.current.checked = true;
                }}
                className={`${fieldClass} ml-auto w-auto min-w-[9rem] font-mono text-sm`}
              >
                {byHour(later).map((group) => (
                  <optgroup key={group.hour} label={group.hour}>
                    {group.windows.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className={FIELDSET}>
        <Legend icon={<UserIcon size={20} />} step={2}>
          Who&apos;s picking up
        </Legend>
        <div className="clear-both grid gap-4">
          <Field
            name="customerName"
            defaultValue={state.values?.customerName ?? member?.name}
            label="Name"
            autoComplete="given-name"
            maxLength={60}
            error={error("customerName")}
          />
          <p
            id="contact-rule"
            className="text-muted-foreground max-w-measure text-sm"
          >
            One of these is enough: an email or a mobile number, so we can reach
            you about your Order. We use them for nothing else.{" "}
            <Link href="/privacy">Privacy</Link>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="customerEmail"
              defaultValue={state.values?.customerEmail ?? member?.email}
              label="Email"
              type="email"
              autoComplete="email"
              {...contact}
              error={noContact ? undefined : error("customerEmail")}
            />
            <Field
              name="customerPhone"
              defaultValue={state.values?.customerPhone}
              label="Mobile number"
              type="tel"
              autoComplete="tel"
              placeholder="0917 123 4567"
              {...contact}
              error={error("customerPhone")}
            />
          </div>
          {noContact && (
            <p id="contact-error" className="text-destructive -mt-2 text-sm">
              {error("customerEmail")}
            </p>
          )}
        </div>
      </fieldset>

      <fieldset className={FIELDSET}>
        <Legend icon={<WalletIcon size={20} />} step={3}>
          Payment
        </Legend>
        <div className="clear-both grid gap-3">
          {payments.map((p) => (
            <label
              key={p.value}
              className="border-input has-[:checked]:border-primary has-[:checked]:bg-muted has-[:focus-visible]:outline-ring rounded-card flex min-h-14 cursor-pointer items-center gap-3 border px-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={p.value}
                defaultChecked={p.value === keptPayment}
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
        {useReward && reward && (
          // Display only: the server prices the Order again (ADR 0002).
          <dl className="grid gap-1">
            <div className="flex justify-between gap-4">
              <dt>Free drink (9 Stars)</dt>
              <dd className="font-mono whitespace-nowrap">
                &minus;{formatPrice(reward.discountCents)}
              </dd>
            </div>
            <div className="border-border flex justify-between gap-4 border-t pt-2 text-lg font-semibold">
              <dt>Total</dt>
              <dd className="font-mono whitespace-nowrap">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>
        )}
        <p ref={status} role="status" className="min-h-6 font-semibold">
          {state.message && (
            <span className="text-destructive">{state.message}</span>
          )}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground min-h-14 rounded-full px-8 text-lg font-semibold disabled:opacity-60"
        >
          {pending
            ? "Placing your order..."
            : `Place order, ${useReward ? formatPrice(total) : totalText}`}
        </button>
      </div>
    </form>
  );
}
