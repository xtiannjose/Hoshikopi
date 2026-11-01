import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { formatDate, manilaInstant } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { starTotals } from "@/modules/loyalty";
import { salesReport } from "@/modules/ordering";

export const metadata: Metadata = { title: "Reports" };

const RANGES = [7, 30] as const;

export default function ReportsPage({
  searchParams,
}: PageProps<"/manage/reports">) {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage">Manage</Link>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">Reports</h1>
      <p className="text-muted-foreground mt-2">
        Picked Up Orders by the day they were placed, Manila time. Demo data:
        Orders placed on this concept site.
      </p>
      <Suspense fallback={<p className="mt-6">Adding it up...</p>}>
        <Report searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const cell = "border-border border-b py-2 pr-4";

async function Report({
  searchParams,
}: Pick<PageProps<"/manage/reports">, "searchParams">) {
  await requireStaff("manager", "/manage/reports");
  const range = (await searchParams).days === "30" ? 30 : 7;
  const [sales, stars] = await Promise.all([
    salesReport(range),
    starTotals(range),
  ]);
  const average = sales.totals.orders
    ? Math.round(sales.totals.totalCents / sales.totals.orders)
    : 0;
  return (
    <div className="mt-6 grid gap-10">
      <nav aria-label="Report range" className="flex gap-2">
        {RANGES.map((days) => (
          <Link
            key={days}
            href={`/manage/reports?days=${days}`}
            aria-current={days === range ? "page" : undefined}
            className="border-input aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground inline-flex min-h-11 items-center rounded-full border px-4 font-semibold no-underline"
          >
            Last {days} days
          </Link>
        ))}
      </nav>

      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          ["Sales", formatPrice(sales.totals.totalCents)],
          ["Orders picked up", String(sales.totals.orders)],
          ["Average order", formatPrice(average)],
        ].map(([label, value]) => (
          <div key={label} className="bg-muted rounded-card p-4">
            <dt className="text-muted-foreground text-sm">{label}</dt>
            <dd className="font-mono text-2xl">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="by-day">
        <h2 id="by-day" className="font-display pb-1 text-2xl italic">
          Sales by day
        </h2>
        {sales.days.length === 0 ? (
          <p className="mt-2">No Orders picked up in these days yet.</p>
        ) : (
          <table className="mt-3 w-full text-left">
            <thead>
              <tr>
                <th scope="col" className={cell}>
                  Day
                </th>
                <th scope="col" className={cell}>
                  Orders
                </th>
                <th scope="col" className={cell}>
                  Sales
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.days.map((row) => (
                <tr key={row.day}>
                  <th scope="row" className={`${cell} font-normal`}>
                    {formatDate(manilaInstant(row.day, 12 * 60))}
                  </th>
                  <td className={`${cell} font-mono`}>{row.orders}</td>
                  <td className={`${cell} font-mono`}>
                    {formatPrice(row.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="top-items">
        <h2 id="top-items" className="font-display pb-1 text-2xl italic">
          Top Menu Items
        </h2>
        {sales.topItems.length === 0 ? (
          <p className="mt-2">Nothing sold in these days yet.</p>
        ) : (
          <table className="mt-3 w-full text-left">
            <thead>
              <tr>
                <th scope="col" className={cell}>
                  Menu Item
                </th>
                <th scope="col" className={cell}>
                  Sold
                </th>
                <th scope="col" className={cell}>
                  Sales
                </th>
              </tr>
            </thead>
            <tbody>
              {sales.topItems.map((row) => (
                <tr key={row.name}>
                  <th scope="row" className={`${cell} font-normal`}>
                    {row.name}
                  </th>
                  <td className={`${cell} font-mono`}>{row.quantity}</td>
                  <td className={`${cell} font-mono`}>
                    {formatPrice(row.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid gap-10 sm:grid-cols-2">
        <section aria-labelledby="stars">
          <h2 id="stars" className="font-display pb-1 text-2xl italic">
            Stars
          </h2>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
            {[
              ["Earned on Orders", stars.earned],
              ["Birthday Treats", stars.birthday],
              ["Redeemed for free drinks", stars.redeemed],
              ["Taken back on Refunds", stars.takenBack],
              ["Adjusted by a Manager", stars.adjusted],
            ].map(([label, value]) => (
              <div key={label} className="contents">
                <dt>{label}</dt>
                <dd className="text-right font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="outcomes">
          <h2 id="outcomes" className="font-display pb-1 text-2xl italic">
            Orders that did not go through
          </h2>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
            {[
              ["Cancelled", sales.outcomes.cancelled],
              ["Expired unpaid", sales.outcomes.expired],
              ["Refunded", sales.outcomes.refunded],
            ].map(([label, value]) => (
              <div key={label} className="contents">
                <dt>{label}</dt>
                <dd className="text-right font-mono">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
