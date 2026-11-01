import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { OpenStatus } from "@/components/cafe/open-status";
import { formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { getHours } from "@/modules/cafe";
import { currentCartOwner } from "@/modules/cart";
import { currentMember, memberProfile } from "@/modules/identity";
import { birthdayTreat } from "@/modules/loyalty";
import { checkoutView } from "@/modules/ordering";

import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 md:px-8">
      <h1 className="font-display pt-8 pb-1 text-5xl italic">Checkout</h1>
      <Suspense fallback={<p className="mt-6">Getting your order ready...</p>}>
        <Checkout />
      </Suspense>
      <p className="text-muted-foreground mt-10 font-mono text-sm">
        Hoshikopi is a concept cafe. Orders and payments here are for
        demonstration. <Link href="/concept">About this concept</Link>
      </p>
    </main>
  );
}

async function Checkout() {
  const owner = await currentCartOwner();
  const member = await currentMember();
  // The Birthday Treat lands before the Reward is offered (LOY-04).
  if (member) {
    const profile = await memberProfile(member.id);
    await birthdayTreat(member.id, profile?.birthMonth ?? null);
  }
  const view = await checkoutView(owner, member?.id ?? null);
  const { state, cart } = view;

  if (cart.lines.length === 0) {
    return (
      <div className="mt-6 grid justify-items-start gap-4">
        <p className="text-lg">Your Cart is empty.</p>
        <Link href="/menu">See the menu</Link>
      </div>
    );
  }
  if (!state.canOrder) {
    const hours = await getHours();
    return (
      <div role="status" className="bg-muted rounded-card mt-6 grid gap-2 p-6">
        {state.reason === "paused" ? (
          <>
            <p className="text-warning text-lg font-semibold">
              Ordering is paused until {formatTime(state.until)}.
            </p>
            {state.message && <p>{state.message}</p>}
          </>
        ) : (
          <>
            <p className="text-lg font-semibold">
              We&apos;re not taking orders right now.
            </p>
            <p>
              <OpenStatus hours={hours} fallback="Check our hours." />
            </p>
          </>
        )}
        <p>Your Cart is saved for later.</p>
      </div>
    );
  }
  if (cart.blocked) {
    return (
      <p className="mt-6">
        Something in your Cart changed.{" "}
        <Link href="/cart">Check your Cart</Link>.
      </p>
    );
  }

  const [first, ...later] = view.windows;
  return (
    <div className="mt-6 grid gap-8">
      <section aria-labelledby="summary" className="bg-muted rounded-card p-5">
        <h2 id="summary" className="sr-only">
          Your order
        </h2>
        <ul className="grid gap-2">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-4">
              <span>
                {line.quantity} x {line.name}
                {line.options.length > 0 && (
                  <span className="text-muted-foreground block text-sm">
                    {line.options.map((o) => o.name).join(", ")}
                  </span>
                )}
              </span>
              <span className="font-mono whitespace-nowrap">
                {formatPrice(line.lineCents ?? 0)}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-border mt-4 flex justify-between border-t pt-3 text-lg font-semibold">
          Total{" "}
          <span className="font-mono whitespace-nowrap">
            {formatPrice(cart.totalCents)}
          </span>
        </p>
        <p className="text-muted-foreground text-sm">
          Prices include VAT. No fees on top.{" "}
          <Link href="/cart">Edit your Cart</Link>
        </p>
      </section>

      {state.minutesToLastOrder <= 60 && (
        <p className="text-warning font-semibold">
          Last order in {state.minutesToLastOrder} min.
        </p>
      )}

      {!first ? (
        <p className="bg-muted rounded-card p-5">
          No Pickup Times are left today. Walk in and order at the counter.
        </p>
      ) : (
        <CheckoutForm
          asap={{
            value: "asap",
            label: `Ready in about ${view.prepMinutes} min, around ${formatTime(first.start)}`,
          }}
          windows={later.map((w) => ({
            value: w.start.toISOString(),
            label: formatTime(w.start),
          }))}
          totalCents={cart.totalCents}
          totalText={formatPrice(cart.totalCents)}
          payAtPickupAllowed={view.payAtPickupAllowed}
          member={member ? { name: member.name, email: member.email } : null}
          reward={view.reward}
        />
      )}
    </div>
  );
}
