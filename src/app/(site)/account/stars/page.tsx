import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { StarCard } from "@/components/star-card";
import { formatDate } from "@/lib/clock";
import { requireMember } from "@/modules/identity";
import { balance, starHistory } from "@/modules/loyalty";

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

export default function StarsPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 md:px-8">
      <Suspense fallback={<p className="pt-8">Counting your Stars...</p>}>
        <Stars />
      </Suspense>
    </main>
  );
}

async function Stars() {
  const member = await requireMember("/account/stars");
  const [stars, history] = await Promise.all([
    balance(member.id),
    starHistory(member.id),
  ]);
  return (
    <div className="grid gap-10 pt-8">
      <div>
        <Link href="/account">Your account</Link>
        <h1 className="font-display mt-2 pb-1 text-5xl italic">Your Stars</h1>
      </div>
      <StarCard balance={stars} />
      <section aria-labelledby="how">
        <h2 id="how" className="font-display text-3xl italic">
          How Stars work
        </h2>
        <ul className="mt-3 grid list-disc gap-1 pl-5">
          <li>
            Sign in before you order. Each drink lights one Star when you pick
            it up.
          </li>
          <li>
            Nine Stars make a free drink: tick it at checkout. Options still add
            their price.
          </li>
          <li>
            Cancel, or let an unpaid order lapse, and the Stars come back.
          </li>
          <li>Refunded orders give back the Stars they earned.</li>
        </ul>
      </section>
      <section aria-labelledby="history">
        <h2 id="history" className="font-display text-3xl italic">
          Star history
        </h2>
        {history.length === 0 ? (
          <p className="mt-3">
            No Stars yet. Your first drink lights the first one.
          </p>
        ) : (
          <ul className="border-border mt-4 border-t">
            {history.map((entry, index) => (
              <li
                key={index}
                className="border-border flex justify-between gap-4 border-b py-3"
              >
                <span>
                  {KIND[entry.kind]}
                  {entry.reason &&
                    entry.kind === "adjust" &&
                    `: ${entry.reason}`}
                  <span className="text-muted-foreground block text-sm">
                    {formatDate(entry.createdAt)}
                  </span>
                </span>
                <span className="font-mono font-semibold">
                  {entry.stars > 0 ? `+${entry.stars}` : entry.stars}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
