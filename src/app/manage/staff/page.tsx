import type { Metadata } from "next";
import { Suspense } from "react";
import { UserPlusIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Empty, Panel } from "@/components/panel";
import { requireStaff, staffMembers } from "@/modules/identity";

import { RoleForm } from "./role-form";
import { TeamList } from "./team-list";

export const metadata: Metadata = { title: "Staff", robots: { index: false } };

export default function ManageStaffPage() {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <PageHeader
        size="staff"
        back={<BackLink href="/manage">Manage</BackLink>}
        title="Staff"
        intro="Give a role to someone who has signed in once, with email or Google. Taking a role away signs them out at once. Every change is logged."
      />
      <Suspense fallback={<p className="mt-6">Finding the team...</p>}>
        <Staff />
      </Suspense>
    </main>
  );
}

const count = (n: number, word: string) =>
  n ? `${n} ${word}${n === 1 ? "" : "s"}` : "";

async function Staff() {
  const me = await requireStaff("manager", "/manage/staff");
  const staff = await staffMembers();
  const managers = staff.filter((p) => p.role === "manager").length;
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
      <Panel
        id="add-staff"
        title="Add Staff"
        icon={<UserPlusIcon size={20} />}
        className="lg:sticky lg:top-6"
      >
        <RoleForm />
        <dl className="border-border mt-5 grid gap-2 border-t pt-5 text-sm">
          <div>
            <dt className="inline font-semibold">Barista:</dt>{" "}
            <dd className="inline">the Bar Screen and Sold Out on the menu.</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Manager:</dt>{" "}
            <dd className="inline">
              everything in Manage, including Refunds and Staff.
            </dd>
          </div>
        </dl>
      </Panel>

      <section aria-labelledby="team">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 id="team" className="font-display text-3xl italic">
            The team
          </h2>
          <p className="text-muted-foreground text-sm">
            {[
              count(managers, "Manager"),
              count(staff.length - managers, "Barista"),
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
        <TeamList staff={staff} meId={me.id} />
        {staff.every((p) => p.id === me.id) && (
          <div className="mt-4">
            <Empty icon={<UsersThreeIcon size={24} />}>
              {/* Not "above": on wide screens Add Staff sits to the left. */}
              <p>Just you for now. Add your first Barista with Add Staff.</p>
            </Empty>
          </div>
        )}
      </section>
    </div>
  );
}
