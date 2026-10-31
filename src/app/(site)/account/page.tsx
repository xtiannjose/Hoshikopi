import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { formatDate, formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { requireMember } from "@/modules/identity";
import { ordersForMember } from "@/modules/ordering";

import { signOutAction } from "./actions";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

const STATUS: Record<string, string> = {
  placed: "Placed",
  paid: "Paid",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked Up",
  cancelled: "Cancelled",
  expired: "Expired",
  refunded: "Refunded",
};

export default function AccountPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 md:px-8">
      <Suspense fallback={<p className="pt-8">Opening your account...</p>}>
        <Account />
      </Suspense>
    </main>
  );
}

async function Account() {
  const member = await requireMember("/account");
  const orders = await ordersForMember(member.id);
  return (
    <div className="grid gap-10 pt-8">
      <div>
        <h1 className="font-display pb-1 text-5xl italic">
          Hi{member.name ? `, ${member.name}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Signed in as {member.email}.
        </p>
      </div>

      <section aria-labelledby="orders">
        <h2 id="orders" className="font-display text-3xl italic">
          Your orders
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3">
            No orders yet. <Link href="/menu">See the menu</Link>
          </p>
        ) : (
          <ul className="border-border mt-4 border-t">
            {orders.map((order) => (
              <li
                key={order.id}
                className="border-border flex flex-wrap items-baseline justify-between gap-3 border-b py-3"
              >
                <span>
                  <Link href={order.link} className="font-mono font-semibold">
                    {order.code}
                  </Link>{" "}
                  <span className="text-muted-foreground text-sm">
                    {formatDate(order.placedAt)}, {formatTime(order.placedAt)}
                  </span>
                  <span className="block">{order.summary}</span>
                </span>
                <span className="text-right">
                  <span className="block font-mono whitespace-nowrap">
                    {formatPrice(order.totalCents)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {STATUS[order.status]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={signOutAction}>
        <button
          type="submit"
          className="border-input min-h-11 rounded-full border px-5"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
