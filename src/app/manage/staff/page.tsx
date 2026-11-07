import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { requireStaff, staffMembers } from "@/modules/identity";

import { RoleForm } from "./role-form";
import { TeamList } from "./team-list";

export const metadata: Metadata = { title: "Staff", robots: { index: false } };

export default function ManageStaffPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage">Manage</Link>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">Staff</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">
        Give a role to someone who has signed in once, with email or Google.
        Taking a role away signs them out at once. Every change is logged.
      </p>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <Staff />
      </Suspense>
    </main>
  );
}

async function Staff() {
  const me = await requireStaff("manager", "/manage/staff");
  const staff = await staffMembers();
  return (
    <div className="mt-8 grid gap-10">
      <section aria-labelledby="add-staff">
        <h2 id="add-staff" className="font-display text-2xl italic">
          Add Staff
        </h2>
        <div className="rounded-card border-border mt-4 border p-5">
          <RoleForm />
        </div>
      </section>

      <section aria-labelledby="team">
        <h2 id="team" className="font-display text-2xl italic">
          The team
        </h2>
        <TeamList staff={staff} meId={me.id} />
      </section>
    </div>
  );
}
