import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PRIMARY_PILL } from "@/components/panel";
import { formatReceipt } from "@/lib/money";
import { getOrderBrief, orderLink } from "@/modules/ordering";
import {
  checkoutOpen,
  paymentByCheckout,
  paymentProvider,
} from "@/modules/payments";

import { fakePayAction } from "./actions";
import { PayButtons } from "./pay-buttons";

export const metadata: Metadata = {
  title: "Test Mode checkout",
  robots: { index: false },
};

const METHOD = {
  gcash: "GCash",
  maya: "Maya",
  card: "Card",
  pay_at_pickup: "",
};

/** What a closed checkout says, by Payment status. */
const DONE: Record<string, string> = {
  paid: "Paid. Your order is on its way to the bar.",
  expired: "This checkout timed out.",
  refunded: "This payment was refunded.",
};

export default function FakeCheckoutPage({
  params,
  searchParams,
}: PageProps<"/dev/pay/[id]">) {
  return (
    <main id="main" className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <Suspense fallback={<p>Opening the checkout...</p>}>
        <Checkout params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Checkout({
  params,
  searchParams,
}: Pick<PageProps<"/dev/pay/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  // fakePayAction's flag when the webhook refused: nothing was paid.
  const { retry } = await searchParams;
  if (paymentProvider().name !== "fake") notFound();
  const payment = await paymentByCheckout(id);
  if (!payment) notFound();
  const order = await getOrderBrief(payment.orderId);
  // Same site, so a path: the Order page reads its own state (PAY-03).
  const back = orderLink(payment.orderId).replace(/^https?:\/\/[^/]+/, "");
  return (
    <div className="rounded-card border-input grid gap-5 border border-dashed p-6">
      <p className="text-warning font-mono text-sm font-semibold">
        Test Mode: no real money moves
      </p>
      <h1 className="font-display pb-1 text-4xl italic">
        Pay with {METHOD[payment.method]}
      </h1>
      <p className="text-lg">
        Hoshikopi order {order?.code}
        <span className="block font-mono text-2xl font-semibold">
          {formatReceipt(payment.amountCents)}
        </span>
      </p>
      {/* Still open after a failed try, as PayMongo's is (audit journeys:6). */}
      {checkoutOpen(payment.status) ? (
        <>
          {/* Always there, so the words are read out when the redirect
              adds them; a region added already filled may not be. */}
          <p role="status" className="text-destructive min-h-6 font-semibold">
            {retry === "1" &&
              "That didn't go through, and nothing was paid. Please try again."}
          </p>
          <form action={fakePayAction} className="grid gap-3">
            <input type="hidden" name="checkoutId" value={id} />
            <PayButtons amount={formatReceipt(payment.amountCents)} />
          </form>
          {/* Like PayMongo's cancel_url: back to the Order page, nothing
              cancelled there (audit journeys:21). */}
          <Link
            href={back}
            className="text-muted-foreground inline-flex min-h-11 items-center justify-self-center text-sm"
          >
            Go back without paying
          </Link>
        </>
      ) : (
        <>
          <p className="font-semibold">{DONE[payment.status]}</p>
          <Link href={back} className={`${PRIMARY_PILL} justify-self-start`}>
            Back to your order
          </Link>
        </>
      )}
      <p className="text-muted-foreground text-sm">
        This page stands in for a payment provider so the whole flow can be
        tried. Hoshikopi is a concept cafe.
      </p>
    </div>
  );
}
