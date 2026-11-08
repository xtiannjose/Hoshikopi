import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowCounterClockwiseIcon,
  CakeIcon,
  ClockCounterClockwiseIcon,
  CoffeeIcon,
  GiftIcon,
  ReceiptIcon,
  StarIcon,
  StorefrontIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Empty, IconCircle, Panel, PRIMARY_PILL } from "@/components/panel";
import { StarCard } from "@/components/star-card";
import { formatDate, formatMonthYear } from "@/lib/clock";
import { currentMember } from "@/modules/identity";
import { balance, starHistory } from "@/modules/loyalty";
import { ordersForMember } from "@/modules/ordering";

export const metadata: Metadata = {
  title: "Your Stars",
  robots: { index: false },
};

const KIND: Record<string, string> = {
  earn: "Earned for an order",
  reserve: "Spent on a free drink",
  release: "Back from a cancelled order",
  reverse: "Taken back for a refund",
  adjust: "Changed by the cafe",
  birthday: "Birthday Treat",
};

const KIND_ICON: Record<string, typeof StarIcon> = {
  earn: StarIcon,
  reserve: GiftIcon,
  release: ArrowCounterClockwiseIcon,
  reverse: ReceiptIcon,
  adjust: StorefrontIcon,
  birthday: CakeIcon,
};

const HOW = [
  { icon: CoffeeIcon, label: "Sign in, then order" },
  { icon: StarIcon, label: "Pick up, light a Star" },
  { icon: GiftIcon, label: "Nine make a free drink" },
  { icon: ArrowCounterClockwiseIcon, label: "Cancelled? Your Stars come back" },
];

type Entry = Awaited<ReturnType<typeof starHistory>>[number];

export default function StarsPage() {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <Suspense fallback={<p>Counting your Stars...</p>}>
        <Stars />
      </Suspense>
    </main>
  );
}

async function Stars() {
  // Guests see how the card works and the way to get one.
  const member = await currentMember();
  const [stars, history, orders] = member
    ? await Promise.all([
        balance(member.id),
        starHistory(member.id),
        ordersForMember(member.id),
      ])
    : [0, [], []];
  // Only the latest 20 Orders come back; older Stars keep the plain line.
  const ordersById = new Map(orders.map((order) => [order.id, order]));
  const months: { month: string; entries: Entry[] }[] = [];
  for (const entry of history) {
    const month = formatMonthYear(entry.createdAt);
    if (months.at(-1)?.month !== month) months.push({ month, entries: [] });
    months.at(-1)!.entries.push(entry);
  }

  return (
    <div className="grid gap-10">
      <PageHeader
        back={member && <BackLink href="/account">Your account</BackLink>}
        title="Your Stars"
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-8 lg:sticky lg:top-6">
          <StarCard balance={stars} />
          <section aria-labelledby="how" className="grid gap-4">
            <h2 id="how" className="font-display text-3xl italic">
              How Stars work
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {HOW.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="rounded-card border-border flex items-center gap-3 border p-3"
                >
                  <IconCircle>
                    <Icon size={20} />
                  </IconCircle>
                  <span className="font-semibold text-pretty">{label}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {member ? (
          <Panel
            id="history"
            title="Star history"
            icon={<ClockCounterClockwiseIcon size={20} />}
          >
            {months.length === 0 ? (
              <Empty icon={<StarIcon size={24} />}>
                <p>No Stars yet. Your first drink lights the first one.</p>
                <Link href="/menu" className={PRIMARY_PILL}>
                  See the menu
                </Link>
              </Empty>
            ) : (
              <div className="grid gap-6">
                {months.map(({ month, entries }) => (
                  <div key={month}>
                    <h3 className="text-muted-foreground font-mono text-sm">
                      {month}
                    </h3>
                    <ul className="divide-border divide-y">
                      {entries.map((entry, index) => {
                        const Icon = KIND_ICON[entry.kind] ?? StarIcon;
                        const order =
                          entry.kind === "earn" && entry.orderId
                            ? ordersById.get(entry.orderId)
                            : undefined;
                        return (
                          <li
                            key={index}
                            className="flex items-center gap-3 py-3"
                          >
                            <IconCircle>
                              <Icon size={20} />
                            </IconCircle>
                            <span className="min-w-0 flex-1">
                              {order ? (
                                <>
                                  Earned for{" "}
                                  <Link href={order.link} className="font-mono">
                                    {order.code}
                                  </Link>
                                </>
                              ) : (
                                <>
                                  {KIND[entry.kind]}
                                  {entry.reason &&
                                    entry.kind === "adjust" &&
                                    `: ${entry.reason}`}
                                </>
                              )}
                              <span className="text-muted-foreground block text-sm">
                                {formatDate(entry.createdAt)}
                              </span>
                            </span>
                            <span
                              className={`font-mono font-semibold ${entry.stars > 0 ? "text-success" : "text-muted-foreground"}`}
                            >
                              {entry.stars > 0
                                ? `+${entry.stars}`
                                : entry.stars}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        ) : (
          <Empty icon={<StarIcon size={24} />}>
            <p className="max-w-measure">
              Sign in with your email, no password. Your first drink lights the
              first Star.
            </p>
            <Link href="/sign-in?next=/account/stars" className={PRIMARY_PILL}>
              Get your Star Card
            </Link>
          </Empty>
        )}
      </div>
    </div>
  );
}
