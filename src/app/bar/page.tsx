import { Suspense } from "react";

import { now } from "@/lib/clock";
import { requireStaff } from "@/modules/identity";
import { barBoard } from "@/modules/ordering";

import { BarScreen } from "./bar-screen";

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
    />
  );
}
