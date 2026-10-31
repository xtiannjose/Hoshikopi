import type { Metadata } from "next";
import { Suspense } from "react";

import { getCafeDetails } from "@/modules/cafe";
import { requireStaff } from "@/modules/identity";

import { CafeForm } from "./cafe-form";

export const metadata: Metadata = { title: "Cafe details" };

export default function ManageCafePage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="font-display pb-1 text-4xl italic">Cafe details</h1>
      <Suspense fallback={<p className="mt-4">Loading the details...</p>}>
        <Form />
      </Suspense>
    </main>
  );
}

async function Form() {
  await requireStaff("manager", "/manage/cafe");
  return <CafeForm cafe={await getCafeDetails()} />;
}
