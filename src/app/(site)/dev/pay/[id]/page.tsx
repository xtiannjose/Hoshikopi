import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PRIMARY_PILL } from "@/components/panel";
import { formatReceipt } from "@/lib/money";
import { getOrderBrief, orderLink } from "@/modules/ordering";
import { paymentByCheckout, paymentProvider } from "@/modules/payments";

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
  failed: "This payment didn't go through.",
  expired: "This checkout timed out.",
  refunded: "This payment was refunded.",
};

export default function FakeCheckoutPage({
  params,
}: PageProps<"/dev/pay/[id]">) {
  return (
    <main id="main" className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <Suspense fallback={<p>Opening the checkout...</p>}>
        <Checkout params={params} />
      </Suspense>
    </main>
  );
}

async function Checkout({
  params,
}: Pick<PageProps<"/dev/pay/[id]">, "params">) {
  const { id } = await params;
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
      {payment.status === "pending" ? (
        <>
          <form action={fakePayAction} className="grid gap-3">
            <input type="hidden" name="checkoutId" value={id} />
            <PayButtons amount={formatReceipt(payment.amountCents)} />
          </form>
          <Link
            href={back}
            className="text-muted-foreground inline-flex min-h-11 items-center justify-self-center text-sm"
          >
            Cancel and go back
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
