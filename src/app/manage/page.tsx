import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { requireStaff, type Staff } from "@/modules/identity";

import { signOutAction } from "./actions";

export const metadata: Metadata = { title: "Manage", robots: { index: false } };

const ROLE = { barista: "Barista", manager: "Manager", customer: "Customer" };

// What each role may open; pages also check for themselves.
const AREAS: { href: string; label: string; roles: Staff["role"][] }[] = [
  { href: "/bar", label: "Bar Screen", roles: ["barista", "manager"] },
  { href: "/manage/menu", label: "Menu", roles: ["barista", "manager"] },
  { href: "/manage/orders", label: "Orders and Refunds", roles: ["manager"] },
  { href: "/manage/reports", label: "Reports", roles: ["manager"] },
  { href: "/manage/hours", label: "Hours and Capacity", roles: ["manager"] },
  { href: "/manage/events", label: "Events", roles: ["manager"] },
  { href: "/manage/inquiries", label: "Inquiries", roles: ["manager"] },
  { href: "/manage/posts", label: "Posts", roles: ["manager"] },
  { href: "/manage/stars", label: "Adjust Stars", roles: ["manager"] },
  { href: "/manage/cafe", label: "Cafe details", roles: ["manager"] },
];

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
  const areas = AREAS.filter((area) => area.roles.includes(staff.role));
  return (
    <div className="mt-4 grid justify-items-start gap-6">
      <p>
        Signed in as {staff.name} ({ROLE[staff.role]}).
      </p>
      {areas.length > 0 && (
        <nav aria-label="Manage">
          <ul className="grid gap-2">
            {areas.map((area) => (
              <li key={area.href}>
                <Link href={area.href} className="text-lg">
                  {area.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
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
