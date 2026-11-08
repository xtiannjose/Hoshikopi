import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ChartBarIcon,
  CoffeeIcon,
  ReceiptIcon,
  StarIcon,
  XCircleIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Empty, OUTLINE_PILL, Panel } from "@/components/panel";
import { formatDate, manila, manilaInstant, now } from "@/lib/clock";
import { addDays } from "@/lib/hours";
import { formatPrice } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { STARS_PER_REWARD, starTotals } from "@/modules/loyalty";
import { salesReport } from "@/modules/ordering";

export const metadata: Metadata = { title: "Reports" };

const RANGES = [7, 30] as const;

export default function ReportsPage({
  searchParams,
}: PageProps<"/manage/reports">) {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <PageHeader
        size="staff"
        back={<BackLink href="/manage">Manage</BackLink>}
        title="Reports"
        intro="Picked Up Orders by the day they were placed, Manila time. Demo data: Orders placed on this concept site."
      />
      <Suspense fallback={<p className="mt-6">Adding it up...</p>}>
        <Report searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const cell = "border-border border-b py-2 pr-4 last:pr-0";
const num = `${cell} text-right tabular-nums`;
const showDay = (day: string) => formatDate(manilaInstant(day, 12 * 60));
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** A bar under a row's label, as long as its share of the best row. */
function Bar({ value, max }: { value: number; max: number }) {
  return (
    <span
      aria-hidden
      className={`mt-1.5 block h-1.5 rounded-full ${value === max && max > 0 ? "bg-primary" : "bg-input"}`}
      style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
    />
  );
}

async function Report({
  searchParams,
}: Pick<PageProps<"/manage/reports">, "searchParams">) {
  await requireStaff("manager", "/manage/reports");
  const range = (await searchParams).days === "30" ? 30 : 7;
  const [sales, stars] = await Promise.all([
    salesReport(range),
    starTotals(range),
  ]);
  const today = manila(now()).day;
  const sold = new Map(sales.days.map((row) => [row.day, row]));
  // Every day in the range, newest first, so quiet days show as zero.
  const days = Array.from({ length: range }, (_, i) => {
    const day = addDays(today, -i);
    return sold.get(day) ?? { day, orders: 0, totalCents: 0 };
  });
  const bestDay = Math.max(...days.map((row) => row.totalCents));
  const busiest = sales.days.reduce(
    (best, row) => (row.orders > best.orders ? row : best),
    sales.days[0]
  );
  const bestItem = Math.max(0, ...sales.topItems.map((row) => row.quantity));
  const average = sales.totals.orders
    ? formatPrice(Math.round(sales.totals.totalCents / sales.totals.orders))
    : "No orders yet";

  return (
    <div className="mt-8 grid gap-10">
      <div className="grid gap-2">
        <nav aria-label="Report range" className="flex flex-wrap gap-2">
          {RANGES.map((days) => (
            <Link
              key={days}
              href={`/manage/reports?days=${days}`}
              aria-current={days === range ? "page" : undefined}
              className="border-input aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground hover:bg-muted inline-flex min-h-11 items-center rounded-full border px-4 font-semibold no-underline"
            >
              Last {days} days
            </Link>
          ))}
        </nav>
        <p className="text-muted-foreground text-sm">
          {showDay(addDays(today, 1 - range))} to {showDay(today)}, Manila time
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ["Sales", formatPrice(sales.totals.totalCents)],
          ["Orders picked up", String(sales.totals.orders)],
          ["Average order", average],
        ].map(([label, value], i) => (
          <div
            key={label}
            className={`bg-muted rounded-card p-5 ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <dt className="text-muted-foreground text-sm font-semibold">
              {label}
            </dt>
            <dd className="font-display mt-1 text-3xl italic tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-10 xl:grid-cols-2 xl:items-start">
        <Panel
          id="by-day"
          title="Sales by day"
          icon={<ChartBarIcon size={20} />}
        >
          {sales.days.length === 0 ? (
            <Empty icon={<ReceiptIcon size={24} />}>
              <p className="max-w-measure">
                No picked up orders in these days yet. Once the bar hands over a
                few kopi, they show up here.
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link href="/bar" className={OUTLINE_PILL}>
                  Open the Bar Screen
                </Link>
                {range === 7 && (
                  // Not "...last 30 days": tests find the range pill by that name.
                  <Link href="/manage/reports?days=30">Look back 30 days</Link>
                )}
              </div>
            </Empty>
          ) : (
            <>
              <p className="text-muted-foreground">
                Busiest day: {showDay(busiest.day)},{" "}
                {plural(busiest.orders, "order")}
              </p>
              <table className="mt-3 w-full text-left">
                <thead>
                  <tr>
                    <th scope="col" className={cell}>
                      Day
                    </th>
                    <th scope="col" className={num}>
                      Orders
                    </th>
                    <th scope="col" className={num}>
                      Sales
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((row) => (
                    <tr
                      key={row.day}
                      className={row.orders ? "" : "text-muted-foreground"}
                    >
                      <th scope="row" className={`${cell} font-normal`}>
                        {showDay(row.day)}
                        <Bar value={row.totalCents} max={bestDay} />
                      </th>
                      <td className={num}>{row.orders}</td>
                      <td className={num}>{formatPrice(row.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Panel>

        <Panel
          id="top-items"
          title="Top Menu Items"
          icon={<CoffeeIcon size={20} />}
        >
          {sales.topItems.length === 0 ? (
            <p className="text-muted-foreground">
              Nothing sold in these days yet.
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th scope="col" className={cell}>
                    Menu Item
                  </th>
                  <th scope="col" className={num}>
                    Sold
                  </th>
                  <th scope="col" className={num}>
                    Sales
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.topItems.map((row, i) => (
                  <tr key={row.name}>
                    <th scope="row" className={`${cell} font-normal`}>
                      <span className="flex gap-3">
                        <span className="text-muted-foreground w-5 shrink-0 text-right tabular-nums">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          {row.name}
                          <Bar value={row.quantity} max={bestItem} />
                        </span>
                      </span>
                    </th>
                    <td className={num}>{row.quantity}</td>
                    <td className={num}>{formatPrice(row.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="grid gap-10 sm:grid-cols-2 sm:items-start">
        <Panel
          id="stars"
          title="Stars"
          icon={<StarIcon size={20} weight="fill" className="text-star" />}
        >
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
            <dt>Earned on Orders</dt>
            <dd className="text-right tabular-nums">{stars.earned}</dd>
            <dt>Birthday Treats</dt>
            <dd className="text-right tabular-nums">{stars.birthday}</dd>
            <dt>
              Redeemed for free drinks{" "}
              <span className="text-muted-foreground">
                (
                {plural(
                  Math.floor(stars.redeemed / STARS_PER_REWARD),
                  "free drink"
                )}
                )
              </span>
            </dt>
            <dd className="text-right tabular-nums">{stars.redeemed}</dd>
            <dt>Taken back on Refunds</dt>
            <dd className="text-right tabular-nums">{stars.takenBack}</dd>
            <dt>
              <Link href="/manage/stars">Adjusted by a Manager</Link>
            </dt>
            <dd className="text-right tabular-nums">
              {stars.adjusted > 0 ? `+${stars.adjusted}` : stars.adjusted}
            </dd>
          </dl>
        </Panel>
        <Panel
          id="outcomes"
          title="Orders that did not go through"
          icon={<XCircleIcon size={20} />}
        >
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
            <dt>
              <Link href="/manage/orders">Cancelled</Link>
            </dt>
            <dd className="text-right tabular-nums">
              {sales.outcomes.cancelled}
            </dd>
            <dt>Expired unpaid</dt>
            <dd className="text-right tabular-nums">
              {sales.outcomes.expired}
            </dd>
            <dt>
              <Link href="/manage/orders">Refunded</Link>
            </dt>
            <dd className="text-right tabular-nums">
              {sales.outcomes.refunded}
            </dd>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
