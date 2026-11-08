import Link from "next/link";
import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import { now } from "@/lib/clock";
import { requireStaff } from "@/modules/identity";
import { barBoard } from "@/modules/ordering";

import { BarScreen } from "./bar-screen";

const link = "inline-flex min-h-11 items-center no-underline hover:underline";

export default function BarPage() {
  return (
    <main id="main" className="flex-1 px-4 py-4 lg:px-6">
      <Suspense fallback={<p>Opening the Bar Screen...</p>}>
        <Bar />
      </Suspense>
    </main>
  );
}

async function Bar() {
  const staff = await requireStaff("barista", "/bar");
  return (
    <BarScreen
      initial={JSON.parse(JSON.stringify(await barBoard(now())))}
      manager={staff.role === "manager"}
      staffName={staff.name}
      links={
        <>
          {/* Staff arrive from their account page (the For Staff box). */}
          <BackLink href="/account">Your account</BackLink>
          <Link href="/manage" className={link}>
            Manage
          </Link>
          <Link href="/manage/menu" className={`${link} text-sm`}>
            Sold out?
          </Link>
        </>
      }
    />
  );
}
