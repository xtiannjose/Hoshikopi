import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PickupLine } from "@/components/pickup-line";
import { formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { getOrderForCustomer } from "@/modules/ordering";

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

async function Order({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const { t } = await searchParams;
  const order = await getOrderForCustomer(id, typeof t === "string" ? t : "");
  if (!order) notFound();
  const firstDrink = order.lines[0]?.name ?? "order";
  return (
    <div className="pt-8">
      <p className="text-muted-foreground font-mono text-sm">Order Code</p>
      <h1 className="font-display pb-1 text-6xl italic">{order.code}</h1>
      <p className="mt-4 text-lg">
        Salamat, {order.customerName}! We&apos;re making your {firstDrink}.
      </p>
      <p className="mt-2 text-lg">
        Pickup{" "}
        {order.pickupKind === "asap" ? "as soon as possible, around" : "at"}{" "}
        <span className="font-semibold">{formatTime(order.windowStart)}</span>.
      </p>

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
            : "Paid online."}
        </p>
      </section>
      <div className="mt-6">
        <PickupLine />
      </div>
    </div>
  );
}
