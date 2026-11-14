import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import {
  CaretLeftIcon,
  CaretRightIcon,
  ReceiptIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { OrderStatusPill } from "@/components/order-status-pill";
import { PageHeader } from "@/components/page-header";
import { Empty, OUTLINE_PILL, Pill } from "@/components/panel";
import { formatDate, formatTime, manila, now } from "@/lib/clock";
import { addDays } from "@/lib/hours";
import { formatPrice } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { dayOrders, ordersToRefund } from "@/modules/ordering";

import { cancelAction, refundAction } from "./actions";

export const metadata: Metadata = { title: "Orders and Refunds" };

const PAYMENT: Record<string, string> = {
  gcash: "GCash",
  maya: "Maya",
  card: "Card",
  pay_at_pickup: "Pay at Pickup",
};

const back = <BackLink href="/manage">Manage</BackLink>;

export default function ManageOrdersPage({
  searchParams,
}: PageProps<"/manage/orders">) {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <Suspense
        fallback={
          <>
            <PageHeader back={back} title="Orders and Refunds" size="staff" />
            <p className="mt-4">Loading the day...</p>
          </>
        }
      >
        <Day searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** What a refund or cancel did, in fixed copy; the code shows only when it
 * looks like an Order Code, since it comes back through the URL. */
function doneLine(done: unknown, code: unknown): ReactNode {
  const real = typeof code === "string" && /^K-\d+$/.test(code);
  const that = real ? code : "that Order";
  switch (done) {
    case "refunded":
      return `Refunded ${that}. The Customer sees it on their Order page.`;
    case "refunded_cash":
      return `Refunded ${that} in cash. The Customer sees it on their Order page.`;
    case "cancelled":
      return `Cancelled ${that}. Your reason shows on their Order page.`;
    case "failed":
      return (
        <span className="text-destructive">
          The refund for {that} didn&apos;t go through. Try again in a minute.
        </span>
      );
    case "cancel_reason":
      return (
        <span className="text-destructive">
          {that} wasn&apos;t cancelled. Write a reason the Customer will see.
        </span>
      );
    case "cancel_not_allowed":
      return (
        <span className="text-destructive">
          {real ? code : "That Order"} can&apos;t be cancelled now. It was
          already picked up, cancelled or refunded.
        </span>
      );
    case "not_allowed":
      return (
        <span className="text-destructive">
          {real ? code : "That Order"} can&apos;t be refunded now. It may have
          changed.
        </span>
      );
    default:
      return null;
  }
}

async function Day({
  searchParams,
}: Pick<PageProps<"/manage/orders">, "searchParams">) {
  await requireStaff("manager", "/manage/orders");
  const { day: asked, done, code } = await searchParams;
  const today = manila(now()).day;
  const day =
    typeof asked === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(asked) &&
    !Number.isNaN(Date.parse(asked))
      ? asked
      : today;
  const isToday = day === today;
  const shown = formatDate(new Date(`${day}T04:00:00Z`));
  const { orders, count, totalCents } = await dayOrders(day);
  const toRefund = await ordersToRefund();
  const toCollect = orders.filter(
    (o) => o.cancellable && !o.paid && o.paymentMethod === "pay_at_pickup"
  );
  const closed = orders.filter(
    (o) => o.status === "cancelled" || o.status === "refunded"
  ).length;
  const line = doneLine(done, code);
  return (
    <div className="grid gap-6">
      <PageHeader
        back={back}
        title="Orders and Refunds"
        size="staff"
        intro={
          <>
            {shown} {isToday && <Pill>Today</Pill>}
          </>
        }
      />
      <div className="flex flex-wrap items-end gap-3">
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
          <button type="submit" className={OUTLINE_PILL}>
            Show
          </button>
        </form>
        <Link
          href={`/manage/orders?day=${addDays(day, -1)}`}
          className={OUTLINE_PILL}
        >
          <CaretLeftIcon aria-hidden size={18} />
          Previous day
        </Link>
        {day < today && (
          <Link
            href={`/manage/orders?day=${addDays(day, 1)}`}
            className={OUTLINE_PILL}
          >
            Next day
            <CaretRightIcon aria-hidden size={18} />
          </Link>
        )}
        {!isToday && (
          <Link href="/manage/orders" className={OUTLINE_PILL}>
            Back to today
          </Link>
        )}
      </div>

      {line && (
        <p role="status" className="font-semibold">
          {line}
        </p>
      )}

      {/* Money still held for an Order that is over, any day: it used to
          show only in a log line Vercel keeps for an hour (audit ops:1). */}
      {toRefund.length > 0 && (
        <section
          aria-labelledby="to-refund"
          className="border-destructive rounded-card grid gap-2 border-2 p-4"
        >
          <h2 id="to-refund" className="text-lg font-semibold">
            Needs a refund
          </h2>
          <p className="text-sm">
            Paid after it closed, or its refund didn&apos;t go through. Open its
            day and refund it there.
          </p>
          <ul className="grid gap-1">
            {toRefund.map((o) => {
              const orderDay = o.serviceDay.toISOString().slice(0, 10);
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/manage/orders?day=${orderDay}`}
                    className="font-mono"
                  >
                    {o.code}
                  </Link>
                  <span>{formatDate(new Date(`${orderDay}T04:00:00Z`))}</span>
                  <OrderStatusPill status={o.status} />
                  <span className="font-mono">{formatPrice(o.totalCents)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ul className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
        <Tile label="Orders" value={String(count)} />
        <Tile
          label="Sales"
          value={formatPrice(totalCents)}
          note="Cancelled, expired and refunded Orders are left out."
        />
        <Tile
          label="Pay at Pickup still to collect"
          value={formatPrice(toCollect.reduce((s, o) => s + o.totalCents, 0))}
          note={
            toCollect.length === 1 ? "1 order" : `${toCollect.length} orders`
          }
        />
        <Tile label="Cancelled or refunded" value={String(closed)} />
      </ul>

      {orders.length === 0 ? (
        <Empty icon={<ReceiptIcon size={24} />}>
          <p>No orders on {shown} yet.</p>
          {isToday ? (
            <Link href="/bar" className={OUTLINE_PILL}>
              Open the Bar Screen
            </Link>
          ) : (
            <Link href="/manage/orders" className={OUTLINE_PILL}>
              Back to today
            </Link>
          )}
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left">
            <caption className="sr-only">Orders on {shown}</caption>
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
                <th
                  scope="col"
                  className="hidden max-w-[28rem] pr-3 lg:table-cell"
                >
                  Items
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
                    {/* Each link carries its Order's token; no need to prefetch them all. */}
                    <Link href={order.link} prefetch={false}>
                      {order.code}
                    </Link>
                  </th>
                  <td className="py-3 pr-3 font-mono text-sm">
                    {formatTime(order.placedAt)}
                  </td>
                  <td className="py-3 pr-3">{order.customerName}</td>
                  <td className="hidden max-w-[28rem] py-3 pr-3 lg:table-cell">
                    {order.summary}
                  </td>
                  <td className="py-3 pr-3 font-mono text-sm">
                    {formatTime(order.windowStart)}
                  </td>
                  <td className="py-3 pr-3">{PAYMENT[order.paymentMethod]}</td>
                  <td className="py-3 pr-3">
                    <OrderStatusPill status={order.status} />
                  </td>
                  <td className="py-3 pr-3 text-right font-mono whitespace-nowrap tabular-nums">
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
                          <input type="hidden" name="code" value={order.code} />
                          <input type="hidden" name="day" value={day} />
                          {/* Pay at Pickup money is at the counter: no
                              provider refund, so say to hand it back
                              (audit staff:18). */}
                          {order.paymentMethod === "pay_at_pickup" ? (
                            <>
                              <input type="hidden" name="cash" value="1" />
                              <p className="text-sm">
                                Give {formatPrice(order.totalCents)} back in
                                cash, then confirm.
                              </p>
                            </>
                          ) : (
                            <p className="text-sm">
                              Refund {formatPrice(order.totalCents)} in full?
                            </p>
                          )}
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
                          <input type="hidden" name="code" value={order.code} />
                          <input type="hidden" name="day" value={day} />
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
                            list="cancel-reasons"
                            maxLength={160}
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
          <datalist id="cancel-reasons">
            <option value="An ingredient ran out" />
            <option value="The bar is closing early" />
            <option value="You asked us to cancel" />
          </datalist>
        </div>
      )}
    </div>
  );
}

/** One figure in the day's summary strip. */
function Tile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <li className="bg-muted rounded-card p-5">
      <span className="text-muted-foreground block text-sm font-semibold">
        {label}
      </span>
      <span className="font-display mt-1 block text-3xl italic">{value}</span>
      {note && (
        <span className="text-muted-foreground mt-1 block text-sm">{note}</span>
      )}
    </li>
  );
}
