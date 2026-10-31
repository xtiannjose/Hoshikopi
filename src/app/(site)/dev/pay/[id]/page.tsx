import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { formatReceipt } from "@/lib/money";
import { getOrderBrief } from "@/modules/ordering";
import { paymentByCheckout, paymentProvider } from "@/modules/payments";

import { fakePayAction } from "./actions";

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
        <form action={fakePayAction} className="grid gap-3">
          <input type="hidden" name="checkoutId" value={id} />
          <button
            type="submit"
            name="outcome"
            value="pay"
            className="bg-primary text-primary-foreground min-h-14 rounded-full text-lg font-semibold"
          >
            Pay {formatReceipt(payment.amountCents)}
          </button>
          <button
            type="submit"
            name="outcome"
            value="fail"
            className="border-input min-h-12 rounded-full border font-semibold"
          >
            Make the payment fail
          </button>
        </form>
      ) : (
        <p>This checkout is {payment.status}.</p>
      )}
      <p className="text-muted-foreground text-sm">
        This page stands in for a payment provider so the whole flow can be
        tried. Hoshikopi is a concept cafe.
      </p>
    </div>
  );
}
