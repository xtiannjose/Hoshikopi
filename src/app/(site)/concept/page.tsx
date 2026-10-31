import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About this concept",
  description:
    "Hoshikopi is a portfolio project: a full cafe website built as if the cafe were real. What is made up and what is real.",
};

const MADE_UP = [
  [
    "The place",
    "The cafe, its address and its hours. Kapitolyo is a real neighbourhood in Pasig, but Hoshikopi isn't there, so please don't go looking for it.",
  ],
  [
    "The people",
    "Lia, Hoshi, Annika, Christian and every name on an order are examples.",
  ],
  [
    "The menu",
    "Drinks, prices and allergens are invented to make ordering real to try.",
  ],
  ["The photos", "Room and drink pictures are concept images, marked as such."],
  ["Events and news", "Every Event and Post is an example."],
] as const;

const REAL = [
  [
    "The code",
    "Ordering ahead, Pickup Windows that fill up, the Star Card, the Bar Screen and the Manager pages all work.",
  ],
  [
    "Payments",
    "GCash, Maya and cards run in Test Mode only. No real money moves, and real cards are refused.",
  ],
  [
    "Emails",
    "Sign-in and order emails go to the address you type. Use one you own.",
  ],
  [
    "Your data",
    "Accounts are real accounts. You can download or delete yours from your account page.",
  ],
] as const;

export default function ConceptPage() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 md:px-8"
    >
      <p className="text-muted-foreground font-mono text-sm">
        About this concept
      </p>
      <h1 className="font-display mt-3 pb-1 text-4xl leading-[1.1] italic md:text-6xl">
        Hoshikopi is a cafe that doesn&apos;t exist, yet.
      </h1>
      <p className="mt-6 max-w-[60ch] text-lg">
        This is a portfolio project: a full cafe website built as if the cafe
        were real, so every part of it can be tried. You can browse, order, pay
        in Test Mode and watch your Order move through the bar. No real money
        moves, and no drink will be waiting at a counter.
      </p>

      <Facts id="made-up" title="What's made up" rows={MADE_UP} />
      <Facts id="real" title="What's real" rows={REAL} />

      <section aria-labelledby="how" className="mt-14">
        <h2 id="how" className="font-display pb-1 text-3xl italic">
          How it was made
        </h2>
        <p className="mt-4 max-w-[60ch]">
          Research on how Metro Manila cafes take orders, a design that follows
          the cafe&apos;s clock from day to night, and the build itself. The
          case study comes later; the code is on{" "}
          <a href="https://github.com/xtiannjose/Hoshikopi">GitHub</a>.
        </p>
      </section>

      <p className="mt-12">
        <Link
          href="/menu"
          className="bg-primary text-primary-foreground inline-flex min-h-12 items-center rounded-full px-6 font-semibold no-underline"
        >
          Try ordering a drink
        </Link>
      </p>
    </main>
  );
}

function Facts({
  id,
  title,
  rows,
}: {
  id: string;
  title: string;
  rows: readonly (readonly [string, string])[];
}) {
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2 id={id} className="font-display pb-1 text-3xl italic">
        {title}
      </h2>
      <dl className="border-border mt-4 grid border-t">
        {rows.map(([term, detail]) => (
          <div
            key={term}
            className="border-border grid gap-1 border-b py-4 sm:grid-cols-[9rem_1fr] sm:gap-4"
          >
            <dt className="text-muted-foreground font-mono text-sm sm:pt-0.5">
              {term}
            </dt>
            <dd>{detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
