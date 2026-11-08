import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  GithubLogoIcon,
  MaskHappyIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/ssr";

import { PageHeader } from "@/components/page-header";
import { OUTLINE_PILL, Panel, PRIMARY_PILL } from "@/components/panel";
import { demoMode } from "@/modules/payments";

export const metadata: Metadata = {
  title: "About this concept",
  description:
    "Hoshikopi is a portfolio project: a full cafe website built as if the cafe were real. What is made up and what is real.",
};

const TRY = [
  {
    title: "Order a drink.",
    body: "Pick one from the menu and check out as a Guest, or sign in with Google first to collect Stars. Pay at Pickup, or pay on the Test Mode checkout.",
  },
  {
    title: "Be the barista.",
    body: "Nobody is behind this bar, so your Order page lets you tap the bar's steps yourself: Accept, Start making, Ready, Hand it over. The page follows live and chimes at Ready.",
  },
  {
    title: "Collect a Star.",
    body: "Signed in, each drink you hand over lights a Star on your Star Card. Nine make a free drink.",
  },
];

const MADE_UP = [
  [
    "The place",
    "The cafe, its address and its hours. Kapitolyo is a real neighbourhood in Pasig, but Hoshikopi isn't there, so please don't go looking for it.",
  ],
  [
    "The people",
    "Lia, Christian, Annika, Hoshi and every name on an order are examples.",
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
    <main id="main" className="page-width flex-1 pt-8">
      <div className="w-full max-w-6xl">
        <PageHeader
          eyebrow="About this concept"
          title="Hoshikopi is a cafe that doesn't exist, yet."
          intro="This is a portfolio project: a full cafe website built as if the cafe were real, so every part of it can be tried. You can browse, order, pay in Test Mode and watch your Order move through the bar. No real money moves, and no drink will be waiting at a counter."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-start">
          <Facts
            id="made-up"
            title="What's made up"
            icon={<MaskHappyIcon size={20} />}
            rows={MADE_UP}
          />
          <Facts
            id="real"
            title="What's real"
            icon={<SealCheckIcon size={20} />}
            rows={REAL}
          />
        </div>

        {demoMode() && (
          // Demo Mode (ADR 0015): what a visitor on their own can try.
          <section aria-labelledby="try" className="mt-14">
            <h2 id="try" className="font-display pb-1 text-3xl italic">
              Try it in two minutes
            </h2>
            <ol className="max-w-measure mt-4 grid list-decimal gap-3 pl-6">
              {TRY.map((step) => (
                <li key={step.title}>
                  <span className="font-semibold">{step.title}</span>{" "}
                  {step.body}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-labelledby="how" className="mt-14">
          <h2 id="how" className="font-display pb-1 text-3xl italic">
            How it was made
          </h2>
          <p className="max-w-measure mt-4">
            Research on how Metro Manila cafes take orders, a design that
            follows the cafe&apos;s clock from day to night, and the build
            itself. The case study comes later; the code is open for anyone to
            read.
          </p>
        </section>

        <p className="mt-10 flex flex-wrap gap-3">
          <Link href="/menu" className={PRIMARY_PILL}>
            Try ordering a drink
            <ArrowRightIcon aria-hidden size={18} />
          </Link>
          <a
            href="https://github.com/xtiannjose/Hoshikopi"
            className={OUTLINE_PILL}
          >
            <GithubLogoIcon aria-hidden size={18} />
            See the code on GitHub
          </a>
        </p>
      </div>
    </main>
  );
}

function Facts({
  id,
  title,
  icon,
  rows,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  rows: readonly (readonly [string, string])[];
}) {
  return (
    <Panel id={id} title={title} icon={icon}>
      <dl className="divide-border -my-4 grid divide-y">
        {rows.map(([term, detail]) => (
          <div
            key={term}
            className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-4"
          >
            <dt className="text-muted-foreground font-mono text-sm sm:pt-0.5">
              {term}
            </dt>
            <dd>{detail}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
