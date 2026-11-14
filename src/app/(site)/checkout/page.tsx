import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CoffeeIcon, StarIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { OrderLimitNote } from "@/components/order-limit-note";
import { OpenStatus } from "@/components/cafe/open-status";
import { PageHeader } from "@/components/page-header";
import { Empty, OUTLINE_PILL, PRIMARY_PILL } from "@/components/panel";
import { formatTime, now } from "@/lib/clock";
import { afterLastOrder } from "@/lib/hours";
import { formatPrice } from "@/lib/money";
import { getHours } from "@/modules/cafe";
import { currentCartOwner } from "@/modules/cart";
import { currentMember, memberProfile } from "@/modules/identity";
import { birthdayTreat } from "@/modules/loyalty";
import {
  cartFingerprint,
  checkoutView,
  fitsOneOrder,
} from "@/modules/ordering";
import { demoAllDayOrdering } from "@/modules/payments";

import { CheckoutForm } from "./checkout-form";
import { RewardChoice, SummaryTotal } from "./reward-choice";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <div className="w-full max-w-6xl">
        <PageHeader
          back={<BackLink href="/cart">Back to your Cart</BackLink>}
          title="Checkout"
        />
        <Suspense
          fallback={<p className="mt-6">Getting your order ready...</p>}
        >
          <Checkout />
        </Suspense>
        <p className="text-muted-foreground max-w-measure mt-10 font-mono text-sm">
          Hoshikopi is a concept cafe. Orders and payments here are for
          demonstration. <Link href="/concept">About this concept</Link>
        </p>
      </div>
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
      <div className="mt-8">
        <Empty icon={<CoffeeIcon size={24} />}>
          <div>
            <p className="text-lg font-semibold">Your Cart is empty.</p>
            <p className="text-muted-foreground">
              Nothing brewing yet. Pick a drink and we&apos;ll have it ready at
              the counter.
            </p>
          </div>
          <Link href="/menu" className={PRIMARY_PILL}>
            See the menu
          </Link>
        </Empty>
      </div>
    );
  }
  if (!state.canOrder) {
    const hours = await getHours();
    return (
      <div
        role="status"
        className="bg-muted rounded-card mt-8 grid max-w-2xl justify-items-start gap-2 p-6"
      >
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
            {/* Open for walk-ins after Last Order: not "Open now" under
                "not taking orders" (audit journeys:16). */}
            <p>
              {afterLastOrder(now(), hours) ?? (
                <OpenStatus hours={hours} fallback="Check our hours." />
              )}
            </p>
          </>
        )}
        <p>Your Cart is saved for later.</p>
        <Link href="/cafe" className={`${OUTLINE_PILL} mt-2`}>
          See our hours
        </Link>
      </div>
    );
  }
  if (cart.blocked) {
    return (
      <div className="mt-8 grid justify-items-start gap-3">
        <p>Something in your Cart changed.</p>
        <Link href="/cart" className={PRIMARY_PILL}>
          Check your Cart
        </Link>
      </div>
    );
  }
  // Too big for one Pickup Window: say so, not "no Pickup Times are left".
  if (!fitsOneOrder(cart, view.limit)) {
    return (
      <div className="mt-8 grid justify-items-start gap-3">
        <OrderLimitNote limit={view.limit} />
        <Link href="/cart" className={OUTLINE_PILL}>
          Back to your Cart
        </Link>
      </div>
    );
  }

  const [first, ...later] = view.windows;
  const starCount = (n: number) => (n === 1 ? "1 Star" : `${n} Stars`);
  const stars = starCount(cart.drinks);
  // The free drink earns no Star (LOY-01), so say what using it costs.
  const withReward = view.reward
    ? `, or ${cart.drinks === 1 ? "none" : starCount(cart.drinks - 1)} with your free drink`
    : "";
  return (
    <RewardChoice>
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <section
          aria-labelledby="summary"
          className="rounded-card border-border border p-5 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1"
        >
          <h2 id="summary" className="font-display text-2xl italic">
            Your order
          </h2>
          {cart.drinks > 0 && (
            <p className="text-muted-foreground mt-2 flex gap-2 text-sm">
              <StarIcon aria-hidden size={20} className="shrink-0" />
              <span>
                {member ? (
                  `This order lights ${stars} when you pick it up${withReward}.`
                ) : (
                  <>
                    <Link href="/sign-in?next=/checkout">Sign in first</Link>{" "}
                    and this order lights {stars}. Your Cart comes with you.
                  </>
                )}
              </span>
            </p>
          )}
          <ul className="mt-4 grid gap-2">
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
          <SummaryTotal totalCents={cart.totalCents} reward={view.reward} />
          <p className="text-muted-foreground text-sm">
            Prices include VAT. No fees on top.{" "}
            <Link href="/cart">Edit your Cart</Link>
          </p>
        </section>

        <div className="grid min-w-0 gap-8">
          {state.minutesToLastOrder <= 60 && (
            <p className="text-warning font-semibold">
              Last order in {state.minutesToLastOrder} min.
            </p>
          )}

          {view.busy && first && (
            <p className="text-warning font-semibold">
              The bar is extra busy right now, so pickup times are a little
              longer than usual. Salamat for your patience!
            </p>
          )}
          {demoAllDayOrdering() && (
            <p className="text-muted-foreground text-sm">
              This demo takes orders any time of day, so you can try it from
              anywhere. The cafe&apos;s real hours are on the{" "}
              <Link href="/cafe">Visit page</Link>.
            </p>
          )}
          {!first ? (
            <div className="bg-muted rounded-card grid justify-items-start gap-3 p-5">
              <p>
                No Pickup Times are left today. Walk in and order at the
                counter.
              </p>
              <Link href="/cafe" className={OUTLINE_PILL}>
                See our hours
              </Link>
            </div>
          ) : (
            <CheckoutForm
              asap={{
                value: "asap",
                label: `Ready by ${formatTime(first.start)}`,
              }}
              windows={later.map((w) => ({
                value: w.start.toISOString(),
                label: formatTime(w.start),
              }))}
              totalCents={cart.totalCents}
              cart={cartFingerprint(cart)}
              payAtPickupAllowed={view.payAtPickupAllowed}
              member={
                member ? { name: member.name, email: member.email } : null
              }
              reward={view.reward}
            />
          )}
        </div>
      </div>
    </RewardChoice>
  );
}
