import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { formatTime, manila, now } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { dayOrders } from "@/modules/ordering";

import { cancelAction, refundAction } from "./actions";

export const metadata: Metadata = { title: "Orders" };

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
const PAYMENT: Record<string, string> = {
  gcash: "GCash",
  maya: "Maya",
  card: "Card",
  pay_at_pickup: "Pay at Pickup",
};

export default function ManageOrdersPage({
  searchParams,
}: PageProps<"/manage/orders">) {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link href="/manage">Manage</Link>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">Orders</h1>
      <Suspense fallback={<p className="mt-4">Loading the day...</p>}>
        <Day searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Day({
  searchParams,
}: Pick<PageProps<"/manage/orders">, "searchParams">) {
  await requireStaff("manager", "/manage/orders");
  const { day: asked } = await searchParams;
  const today = manila(now()).day;
  const day =
    typeof asked === "string" && /^\d{4}-\d{2}-\d{2}$/.test(asked)
      ? asked
      : today;
  const { orders, count, totalCents } = await dayOrders(day);
  return (
    <div className="mt-6 grid gap-6">
      <form className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="day" className="font-semibold">
            Day
          </label>
          <input
            id="day"
            name="day"
            type="date"
            defaultValue={day}
            className="rounded-card border-input bg-background min-h-11 border px-3"
          />
        </div>
        <button
          type="submit"
          className="border-input min-h-11 rounded-full border px-5 font-semibold"
        >
          Show
        </button>
      </form>
      <p className="text-lg">
        <span className="font-semibold">{count}</span> Orders,{" "}
        <span className="font-mono font-semibold">
          {formatPrice(totalCents)}
        </span>{" "}
        <span className="text-muted-foreground text-sm">
          (cancelled, expired and refunded Orders are left out)
        </span>
      </p>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">No Orders on this day.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left">
            <caption className="sr-only">Orders on {day}</caption>
            <thead className="text-muted-foreground text-sm">
              <tr>
                <th scope="col" className="py-2 pr-3">
                  Code
                </th>
                <th scope="col" className="pr-3">
                  Placed
                </th>
                <th scope="col" className="pr-3">
                  Name
                </th>
                <th scope="col" className="pr-3">
                  Pickup
                </th>
                <th scope="col" className="pr-3">
                  Payment
                </th>
                <th scope="col" className="pr-3">
                  Status
                </th>
                <th scope="col" className="pr-3 text-right">
                  Total
                </th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-border border-t align-top">
                  <th scope="row" className="py-3 pr-3 font-mono">
                    {order.code}
                  </th>
                  <td className="py-3 pr-3 font-mono text-sm">
                    {formatTime(order.placedAt)}
                  </td>
                  <td className="py-3 pr-3">{order.customerName}</td>
                  <td className="py-3 pr-3 font-mono text-sm">
                    {formatTime(order.windowStart)}
                  </td>
                  <td className="py-3 pr-3">{PAYMENT[order.paymentMethod]}</td>
                  <td className="py-3 pr-3">{STATUS[order.status]}</td>
                  <td className="py-3 pr-3 text-right font-mono whitespace-nowrap">
                    {formatPrice(order.totalCents)}
                  </td>
                  <td className="py-2">
                    {order.refundable && (
                      <details>
                        <summary className="min-h-11 cursor-pointer py-2 font-semibold">
                          Refund {order.code}
                        </summary>
                        <form action={refundAction} className="grid gap-2 py-2">
                          <input type="hidden" name="id" value={order.id} />
                          <p className="text-sm">
                            Refund {formatPrice(order.totalCents)} in full?
                          </p>
                          <button
                            type="submit"
                            className="border-destructive text-destructive min-h-11 rounded-full border px-4 font-semibold"
                          >
                            Yes, refund {order.code}
                          </button>
                        </form>
                      </details>
                    )}
                    {order.cancellable && (
                      <details>
                        <summary className="text-destructive min-h-11 cursor-pointer py-2 font-semibold">
                          Cancel {order.code}
                        </summary>
                        <form action={cancelAction} className="grid gap-2 py-2">
                          <input type="hidden" name="id" value={order.id} />
                          <label
                            htmlFor={`reason-${order.id}`}
                            className="text-sm font-semibold"
                          >
                            Reason (the Customer sees it)
                          </label>
                          <input
                            id={`reason-${order.id}`}
                            name="reason"
                            required
                            className="rounded-card border-input bg-background min-h-11 border px-3"
                          />
                          <button
                            type="submit"
                            className="border-destructive text-destructive min-h-11 rounded-full border px-4 font-semibold"
                          >
                            Cancel {order.code}
                            {order.paid && " and refund"}
                          </button>
                        </form>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
