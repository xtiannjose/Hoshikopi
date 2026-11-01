import type { Metadata } from "next";
import { Suspense } from "react";

import { InquiryForm } from "./inquiry-form";

export const metadata: Metadata = {
  title: "Send an inquiry",
  description:
    "Ask Hoshikopi about a private event or an order of more than 15 drinks.",
};

export default function InquirePage({
  searchParams,
}: PageProps<"/cafe/inquire">) {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 md:px-8">
      <h1 className="font-display pt-8 pb-1 text-5xl italic">
        Send an inquiry
      </h1>
      <p className="mt-3 text-lg">
        For a private event at the cafe or an order of more than 15 drinks. Tell
        us what you have in mind and we&apos;ll email you back.
      </p>
      <Suspense fallback={<div className="min-h-96" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({
  searchParams,
}: Pick<PageProps<"/cafe/inquire">, "searchParams">) {
  const { kind } = await searchParams;
  return (
    <InquiryForm
      kind={kind === "large_order" ? "large_order" : "private_event"}
    />
  );
}
