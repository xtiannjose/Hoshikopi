import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { requireStaff } from "@/modules/identity";

import { StarsForm } from "./stars-form";

export const metadata: Metadata = { title: "Stars" };

export default function ManageStarsPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage">Manage</Link>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">Adjust Stars</h1>
      <p className="text-muted-foreground mt-2">
        Every change is kept in the Member&apos;s Star history with your reason.
      </p>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  await requireStaff("manager", "/manage/stars");
  return <StarsForm />;
}
