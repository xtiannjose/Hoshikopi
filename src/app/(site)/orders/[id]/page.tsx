import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  ArrowsClockwiseIcon,
  CalendarPlusIcon,
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  StorefrontIcon,
  TicketIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { mapsUrl } from "@/components/cafe/maps";
import { OpenStatus } from "@/components/cafe/open-status";
import { OrderStatusPill } from "@/components/order-status-pill";
import { OUTLINE_PILL, Panel, PRIMARY_PILL } from "@/components/panel";
import { formatDate, formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { getCafeDetails, getHours } from "@/modules/cafe";
import { getOrderForCustomer, type OrderView } from "@/modules/ordering";
import { demoMode } from "@/modules/payments";

import { orderAgainAction } from "../../account/actions";

import { cancelOrderAction, demoAdvanceAction } from "./actions";
import { StatusPoller } from "./status-poller";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false },
};

export default function OrderPage(props: PageProps<"/orders/[id]">) {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <div className="w-full max-w-6xl">
        <Suspense fallback={<p>Finding your order...</p>}>
          <Order {...props} />
        </Suspense>
      </div>
    </main>
  );
}

type Step = { label: string; at: Date | null };

/** The steps this Order goes through (ORD-08); Paid only when paid online. */
function steps(order: OrderView): Step[] {
  const online = order.paymentMethod !== "pay_at_pickup";
  return [
    { label: "Placed", at: order.placedAt },
    ...(online ? [{ label: "Paid", at: order.paidAt }] : []),
    { label: "Accepted", at: order.acceptedAt },
    { label: "Preparing", at: null },
    { label: "Ready", at: order.readyAt },
    { label: "Picked Up", at: order.pickedUpAt },
  ];
}

const CURRENT: Record<string, string> = {
  placed: "Placed",
  paid: "Paid",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked Up",
};

const paymentFailed = (order: OrderView) =>
  order.status === "placed" && order.payment?.status === "failed";

function message(order: OrderView): string {
  const first = order.lines[0]?.name ?? "order";
  switch (order.status) {
    case "placed":
      if (paymentFailed(order)) {
        return "We got your order, but the payment didn't go through.";
      }
      return order.paymentMethod === "pay_at_pickup"
        ? "Salamat! We got your order. The bar will accept it soon."
        : "Salamat! We got your order. Finish paying to send it to the bar.";
    case "paid":
      return "Payment received. The bar starts on it soon.";
    case "accepted":
      return "The bar has your order.";
    case "preparing":
      return `We're making your ${first}.`;
    case "ready":
      return `Ready at the counter. Show code ${order.code}.`;
    case "picked_up":
      return "Enjoy! See you again soon.";
    case "cancelled":
      return order.cancelReason
        ? `This order was cancelled: ${order.cancelReason}.`
        : "This order was cancelled.";
    case "expired":
      return "Payment didn't come through in time, so this order was let go.";
    case "refunded":
      return "This order was refunded in full.";
  }
}

/** The bar's next tap, as the Bar Screen words it (Demo Mode, ADR 0015). */
const DEMO_STEP: Partial<Record<OrderView["status"], string>> = {
  placed: "Accept the order",
  paid: "Accept the order",
  accepted: "Start making it",
  preparing: "Mark it Ready",
  ready: "Hand it over",
};

/** The bar's queue in a line (FEAT-03). */
function aheadLine(drinks: number): string {
  if (drinks === 0) return "No drinks ahead of yours. You're next at the bar.";
  return drinks === 1
    ? "1 drink ahead of yours."
    : `${drinks} drinks ahead of yours.`;
}

function paymentNote(order: OrderView): string {
  const closed = ["cancelled", "expired", "refunded"].includes(order.status);
  if (order.status === "refunded" || order.payment?.status === "refunded") {
    return "Refunded in full (Test Mode).";
  }
  if (closed) {
    return order.payment?.status === "paid"
      ? "Paid online (Test Mode). The refund is on its way."
      : "Nothing to pay.";
  }
  if (order.paymentMethod === "pay_at_pickup") {
    return "Pay at the counter when you collect.";
  }
  return order.payment?.status === "paid"
    ? "Paid online (Test Mode)."
    : "Not paid yet.";
}

async function Order({ params, searchParams }: PageProps<"/orders/[id]">) {
  // Per request (the link token), and the read below checks the clock.
  await connection();
  const { id } = await params;
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";
  const order = await getOrderForCustomer(id, token);
  if (!order) notFound();
  const [cafe, hours] = await Promise.all([getCafeDetails(), getHours()]);
  const closed = ["cancelled", "expired", "refunded"].includes(order.status);
  const canCancel = order.status === "placed" || order.status === "paid";
  const failed = paymentFailed(order);
  // Still to collect: where, when and what to show.
  const live = !closed && order.status !== "picked_up" && !failed;
  // An unpaid online Order is not on the bar yet.
  const onBar =
    order.status !== "placed" || order.paymentMethod === "pay_at_pickup";
  // Demo Mode: nobody is behind this bar, so the visitor plays the barista.
  const demoStep =
    demoMode() && live && onBar ? DEMO_STEP[order.status] : undefined;
  // Where to go next once this Order is done, or can't go on.
  const nextSteps = closed || order.status === "picked_up" || failed;
  const timeline = steps(order);
  const currentIndex = timeline.findIndex(
    (step) => step.label === CURRENT[order.status]
  );
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <div className="min-w-0">
        {order.isMember ? (
          <BackLink href="/account#orders">Your orders</BackLink>
        ) : (
          <BackLink href="/menu">Back to the menu</BackLink>
        )}
        {/* A ticket stub: the code to show at the counter, then the time. */}
        <div className="rounded-card border-input mt-2 border border-dashed p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground font-mono text-sm">
              Order Code
            </p>
            <OrderStatusPill status={order.status} />
          </div>
          <h1 className="font-display pb-1 text-6xl italic">{order.code}</h1>
          <p className="border-input mt-4 flex flex-wrap justify-between gap-x-4 border-t border-dashed pt-4 font-mono text-sm">
            <span className="text-muted-foreground">Pickup</span>
            <span>
              {formatDate(order.windowStart)}, {formatTime(order.windowStart)}
            </span>
          </p>
        </div>
        <p role="status" className="mt-6 text-lg font-semibold">
          {/* The live region stays; only its words rise in when they change. */}
          <span key={order.status} className="animate-rise block">
            {message(order)}
          </span>
        </p>
        <StatusPoller
          id={order.id}
          token={token}
          code={order.code}
          status={order.status}
          version={order.version}
        />
        {order.status === "placed" && order.payment?.status === "pending" && (
          <a
            href={order.payment.checkoutUrl}
            className={`${PRIMARY_PILL} mt-4`}
          >
            Finish paying
          </a>
        )}
        {failed && (
          <p className="text-destructive max-w-measure mt-4 font-semibold">
            Your payment didn&apos;t go through. This order will be let go in a
            few minutes; place it again, or choose Pay at Pickup.
          </p>
        )}
        {nextSteps && (
          <div className="mt-4 flex flex-wrap gap-3">
            {order.isMember && (
              <form action={orderAgainAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <button type="submit" className={PRIMARY_PILL}>
                  <ArrowsClockwiseIcon aria-hidden size={18} />
                  Order again
                </button>
              </form>
            )}
            {order.isMember && order.status === "picked_up" && (
              <Link href="/account/stars" className={OUTLINE_PILL}>
                See your Stars
              </Link>
            )}
            <Link href="/menu" className={OUTLINE_PILL}>
              See the menu
            </Link>
          </div>
        )}
        {live && (
          <p className="mt-2 text-lg">
            Pickup{" "}
            {order.pickupKind === "asap" ? "as soon as possible, around" : "at"}{" "}
            <span className="font-semibold">
              {formatTime(order.windowStart)}
            </span>
            .
          </p>
        )}
        {live && onBar && order.drinksAhead !== null && (
          <p className="text-muted-foreground mt-1">
            {aheadLine(order.drinksAhead)}
          </p>
        )}

        {!closed && (
          <ol className="mt-8 grid" aria-label="Order Status">
            {timeline.map((step, index) => {
              const done = index < currentIndex;
              const now = index === currentIndex;
              const ready = now && step.label === "Ready";
              // Marks appear in step order, on load and when the poll moves
              // the Order on; a mark that stays put does not replay.
              const delay = { animationDelay: `${index * 60}ms` };
              return (
                <li
                  key={step.label}
                  aria-current={now ? "step" : undefined}
                  className="flex items-center gap-4 py-2"
                >
                  <span
                    aria-hidden
                    className={`relative grid size-8 shrink-0 place-items-center rounded-full ${done ? "bg-primary text-primary-foreground" : now ? "bg-muted" : "border-input border border-dashed"}`}
                  >
                    {done && (
                      <CheckIcon
                        size={16}
                        weight="bold"
                        className="animate-pop"
                        style={delay}
                      />
                    )}
                    {now && (
                      <svg
                        viewBox="0 0 24 24"
                        className={`size-5 ${ready ? "animate-ready" : "animate-pop"}`}
                        style={delay}
                      >
                        {/* Ready is the gold star moment (docs/05 section 6). */}
                        <path
                          d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
                          className={
                            ready
                              ? "fill-star stroke-star-edge"
                              : "fill-primary"
                          }
                          strokeWidth="1"
                        />
                      </svg>
                    )}
                    {ready && (
                      <span
                        className="border-star animate-ring absolute inset-0 rounded-full border-2"
                        style={{ animationDelay: `${index * 60 + 200}ms` }}
                      />
                    )}
                  </span>
                  <span
                    className={
                      now
                        ? "font-semibold"
                        : done
                          ? ""
                          : "text-muted-foreground"
                    }
                  >
                    {step.label}
                    {step.at && (done || now) && (
                      <span className="text-muted-foreground ml-2 font-mono text-sm font-normal">
                        {formatTime(step.at)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {demoStep && (
          <section
            aria-labelledby="demo-bar"
            className="rounded-card border-star bg-muted mt-8 grid justify-items-start gap-3 border p-5"
          >
            <p className="text-muted-foreground font-mono text-sm">Demo Mode</p>
            <h2 id="demo-bar" className="font-display text-2xl italic">
              Be the barista
            </h2>
            <p className="max-w-measure">
              This is a concept cafe, so nobody is behind the bar. Tap the
              bar&apos;s next step yourself and watch this page follow, as it
              would on a real day from the Bar Screen.
            </p>
            <form action={demoAdvanceAction}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="t" value={token} />
              <input type="hidden" name="from" value={order.status} />
              <button type="submit" className={PRIMARY_PILL}>
                {demoStep}
              </button>
            </form>
          </section>
        )}

        {canCancel ? (
          <form
            action={cancelOrderAction}
            className="mt-6 grid justify-items-start gap-2"
          >
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="t" value={token} />
            <button
              type="submit"
              className="border-destructive text-destructive min-h-11 rounded-full border px-5 font-semibold"
            >
              Cancel order
            </button>
            <p className="text-muted-foreground text-sm">
              You can cancel until the bar accepts it. A paid order is refunded
              in full.
            </p>
          </form>
        ) : (
          !closed &&
          order.status !== "picked_up" && (
            <p className="text-muted-foreground mt-6 text-sm">
              The bar has your order, so it can&apos;t be cancelled here.
              Questions?{" "}
              <a
                href={`mailto:${cafe.contactEmail}?subject=${encodeURIComponent(`Order ${order.code}`)}`}
              >
                Email us
              </a>
              .
            </p>
          )
        )}
      </div>

      <div className="grid gap-6 lg:sticky lg:top-6">
        <section
          aria-labelledby="lines"
          className="rounded-card border-border border p-5"
        >
          <h2 id="lines" className="font-display text-2xl italic">
            Your order
          </h2>
          <ul className="mt-3 grid gap-2">
            {order.lines.map((line, index) => (
              <li key={index} className="flex justify-between gap-4">
                <span>
                  {line.quantity} x {line.name}
                  {line.options.length > 0 && (
                    <span className="text-muted-foreground block text-sm">
                      {line.options.map((o) => o.name).join(", ")}
                    </span>
                  )}
                  {line.note && (
                    <span className="block text-sm">Note: {line.note}</span>
                  )}
                </span>
                <span className="font-mono whitespace-nowrap">
                  {formatPrice(line.lineCents)}
                </span>
              </li>
            ))}
          </ul>
          <p className="border-border mt-4 flex justify-between border-t pt-3 text-lg font-semibold">
            Total{" "}
            <span className="font-mono whitespace-nowrap">
              {formatPrice(order.totalCents)}
            </span>
          </p>
          <p className="text-muted-foreground text-sm">{paymentNote(order)}</p>
        </section>
        {live && (
          <Panel
            id="picking-up"
            title="Picking up"
            icon={<StorefrontIcon size={20} />}
          >
            <ul className="grid gap-3">
              <li className="flex gap-3">
                <MapPinIcon aria-hidden size={20} className="mt-0.5 shrink-0" />
                <span>
                  Hoshikopi, {cafe.area}.{" "}
                  {/* A new tab, so this page keeps following the Order. */}
                  <a href={mapsUrl(cafe)} target="_blank" rel="noreferrer">
                    Directions
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <ClockIcon aria-hidden size={20} className="mt-0.5 shrink-0" />
                <OpenStatus hours={hours} fallback="Open daily" />
              </li>
              <li className="flex gap-3">
                <TicketIcon aria-hidden size={20} className="mt-0.5 shrink-0" />
                <span>
                  Show code <span className="font-semibold">{order.code}</span>{" "}
                  at the bar.
                </span>
              </li>
            </ul>
            {order.pickupKind === "scheduled" && (
              <a
                href={`/orders/${order.id}/calendar?t=${encodeURIComponent(token)}`}
                download={`hoshikopi-${order.code}.ics`}
                className={`${OUTLINE_PILL} mt-5`}
              >
                <CalendarPlusIcon aria-hidden size={18} />
                Add to calendar
              </a>
            )}
          </Panel>
        )}
        {!order.isMember && (
          <p className="bg-muted rounded-card p-4">
            Collect Stars next time: <Link href="/sign-in">sign in</Link> with
            your email before you order. Nine Stars make a free drink.
          </p>
        )}
      </div>
    </div>
  );
}
