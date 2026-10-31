import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckIcon } from "@phosphor-icons/react/ssr";

import { PickupLine } from "@/components/pickup-line";
import { formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { getOrderForCustomer, type OrderView } from "@/modules/ordering";

import { cancelOrderAction } from "./actions";
import { StatusPoller } from "./status-poller";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false },
};

export default function OrderPage(props: PageProps<"/orders/[id]">) {
  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 md:px-8">
      <Suspense fallback={<p className="pt-8">Finding your order...</p>}>
        <Order {...props} />
      </Suspense>
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

function message(order: OrderView): string {
  const first = order.lines[0]?.name ?? "order";
  switch (order.status) {
    case "placed":
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

async function Order({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";
  const order = await getOrderForCustomer(id, token);
  if (!order) notFound();
  const closed = ["cancelled", "expired", "refunded"].includes(order.status);
  const canCancel = order.status === "placed" || order.status === "paid";
  const timeline = steps(order);
  const currentIndex = timeline.findIndex(
    (step) => step.label === CURRENT[order.status]
  );
  return (
    <div className="pt-8">
      <StatusPoller
        id={order.id}
        token={token}
        status={order.status}
        version={order.version}
      />
      <p className="text-muted-foreground font-mono text-sm">Order Code</p>
      <h1 className="font-display pb-1 text-6xl italic">{order.code}</h1>
      <p role="status" className="mt-4 text-lg font-semibold">
        {message(order)}
      </p>
      {order.status === "placed" && order.payment?.status === "pending" && (
        <a
          href={order.payment.checkoutUrl}
          className="bg-primary text-primary-foreground mt-4 inline-flex min-h-12 items-center rounded-full px-6 font-semibold no-underline"
        >
          Finish paying
        </a>
      )}
      {order.status === "placed" && order.payment?.status === "failed" && (
        <p className="text-destructive mt-4 font-semibold">
          Your payment didn&apos;t go through. This order will be let go in a
          few minutes; place it again, or choose Pay at Pickup.
        </p>
      )}
      {!closed && order.status !== "picked_up" && (
        <p className="mt-2 text-lg">
          Pickup{" "}
          {order.pickupKind === "asap" ? "as soon as possible, around" : "at"}{" "}
          <span className="font-semibold">{formatTime(order.windowStart)}</span>
          .
        </p>
      )}

      {!closed && (
        <ol className="mt-8 grid" aria-label="Order Status">
          {timeline.map((step, index) => {
            const done = index < currentIndex;
            const now = index === currentIndex;
            return (
              <li
                key={step.label}
                aria-current={now ? "step" : undefined}
                className="flex items-center gap-4 py-2"
              >
                <span
                  aria-hidden
                  className={`grid size-8 shrink-0 place-items-center rounded-full ${done ? "bg-primary text-primary-foreground" : now ? "bg-muted" : "border-input border border-dashed"}`}
                >
                  {done && <CheckIcon size={16} weight="bold" />}
                  {now && (
                    <svg viewBox="0 0 24 24" className="size-5">
                      {/* Ready is the gold star moment (docs/05 section 6). */}
                      <path
                        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
                        className={
                          step.label === "Ready"
                            ? "fill-star stroke-star-edge"
                            : "fill-primary"
                        }
                        strokeWidth="1"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className={
                    now ? "font-semibold" : done ? "" : "text-muted-foreground"
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
            You can cancel until the bar accepts it. A paid order is refunded in
            full.
          </p>
        </form>
      ) : (
        !closed &&
        order.status !== "picked_up" && (
          <p className="text-muted-foreground mt-6 text-sm">
            The bar has your order, so it can&apos;t be cancelled here.
            Questions? Email us.
          </p>
        )
      )}

      <section
        aria-labelledby="lines"
        className="bg-muted rounded-card mt-8 p-5"
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
        <p className="text-muted-foreground text-sm">
          {order.paymentMethod === "pay_at_pickup"
            ? "Pay at the counter when you collect."
            : order.payment?.status === "paid" ||
                order.payment?.status === "refunded"
              ? "Paid online (Test Mode)."
              : "Not paid yet."}
        </p>
      </section>
      <div className="mt-6">
        <PickupLine />
      </div>
    </div>
  );
}
