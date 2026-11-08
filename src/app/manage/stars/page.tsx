import type { Metadata } from "next";
import { Suspense } from "react";
import { InfoIcon, StarIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { requireStaff } from "@/modules/identity";

import { StarsForm } from "./stars-form";

export const metadata: Metadata = { title: "Stars" };

const BEFORE = [
  "One drink lights one Star; nine make a free drink.",
  "The Member sees your reason as Changed by the cafe.",
  "A balance can't go below zero.",
  "Every change is logged with your name.",
];

export default function ManageStarsPage() {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <PageHeader
        size="staff"
        back={<BackLink href="/manage">Manage</BackLink>}
        title="Adjust Stars"
        intro="Every change is kept in the Member's Star history with your reason."
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] lg:items-start">
        <Panel
          id="adjust"
          title="Adjust a Member's Stars"
          icon={<StarIcon size={20} weight="fill" className="text-star" />}
        >
          <Suspense fallback={<p>Getting the Star ledger ready...</p>}>
            <Gate />
          </Suspense>
        </Panel>
        <Panel
          id="before"
          title="Before you adjust"
          icon={<InfoIcon size={20} />}
          className="lg:sticky lg:top-6"
        >
          <ul className="max-w-measure grid gap-3">
            {BEFORE.map((line) => (
              <li key={line} className="flex gap-3">
                <StarIcon
                  aria-hidden
                  size={16}
                  className="text-muted-foreground mt-1 shrink-0"
                />
                {line}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}

async function Gate() {
  await requireStaff("manager", "/manage/stars");
  return <StarsForm />;
}
