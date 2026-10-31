import type { Metadata } from "next";
import { Suspense } from "react";

import { requireStaff } from "@/modules/identity";

import { signOutAction } from "./actions";

export const metadata: Metadata = { title: "Manage", robots: { index: false } };

const ROLE = { barista: "Barista", manager: "Manager", customer: "Customer" };

export default function ManagePage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <h1 className="font-display text-4xl italic">Manage</h1>
      <Suspense fallback={<p className="mt-4">Checking who you are...</p>}>
        <Who />
      </Suspense>
    </main>
  );
}

async function Who() {
  const staff = await requireStaff("barista");
  return (
    <div className="mt-4 grid justify-items-start gap-4">
      <p>
        Signed in as {staff.name} ({ROLE[staff.role]}).
      </p>
      <form action={signOutAction}>
        <button
          type="submit"
          className="border-input min-h-11 rounded-full border px-5"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
