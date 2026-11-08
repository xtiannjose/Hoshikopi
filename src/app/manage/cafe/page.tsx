import type { Metadata } from "next";
import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { getCafeDetails } from "@/modules/cafe";
import { requireStaff } from "@/modules/identity";

import { CafeForm } from "./cafe-form";

export const metadata: Metadata = { title: "Cafe details" };

export default function ManageCafePage() {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <div className="grid gap-8">
        <PageHeader
          back={<BackLink href="/manage">Manage</BackLink>}
          title="Cafe details"
          size="staff"
          intro="What the Visit page tells people: how to find the cafe, what's on hand, and the story behind it."
        />
        <Suspense fallback={<p>Loading the details...</p>}>
          <Form />
        </Suspense>
      </div>
    </main>
  );
}

async function Form() {
  await requireStaff("manager", "/manage/cafe");
  return <CafeForm cafe={await getCafeDetails()} />;
}
