import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  CalendarIcon,
  CoffeeIcon,
  EnvelopeSimpleIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { IconCircle } from "@/components/panel";
import { manila, now } from "@/lib/clock";

import { InquiryForm } from "./inquiry-form";

export const metadata: Metadata = {
  title: "Send an inquiry",
  description:
    "Ask Hoshikopi about a private event or an order of more than 15 drinks.",
};

const GOOD_TO_KNOW = [
  {
    icon: <CalendarIcon size={20} />,
    text: "Private events: the date and how many guests",
  },
  {
    icon: <CoffeeIcon size={20} />,
    text: "More than 15 drinks: ask a day ahead",
  },
  {
    icon: <EnvelopeSimpleIcon size={20} />,
    text: "We reply within two days, by email",
  },
];

export default function InquirePage({
  searchParams,
}: PageProps<"/cafe/inquire">) {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <div className="w-full max-w-6xl">
        <PageHeader
          back={<BackLink href="/cafe#private-events">Visit</BackLink>}
          title="Send an inquiry"
          intro="For a private event at the cafe or an order of more than 15 drinks. Tell us what you have in mind and we'll email you back."
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <Suspense fallback={<div className="min-h-96" />}>
            <Form searchParams={searchParams} />
          </Suspense>
          <aside className="rounded-card border-border border p-5 lg:sticky lg:top-6">
            <h2 className="font-display text-2xl italic">Good to know</h2>
            <ul className="mt-4 grid gap-4">
              {GOOD_TO_KNOW.map((item) => (
                <li key={item.text} className="flex items-center gap-3">
                  <IconCircle>{item.icon}</IconCircle>
                  {item.text}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}

async function Form({
  searchParams,
}: Pick<PageProps<"/cafe/inquire">, "searchParams">) {
  const { kind } = await searchParams;
  // Per request: the earliest date is today on the cafe's clock.
  await connection();
  return (
    <InquiryForm
      kind={kind === "large_order" ? "large_order" : "private_event"}
      today={manila(now()).day}
    />
  );
}
