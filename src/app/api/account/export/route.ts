import { connection } from "next/server";

import { currentMember, memberProfile } from "@/modules/identity";
import { starHistory } from "@/modules/loyalty";
import { ordersForExport } from "@/modules/ordering";

/** "Download my data" (ACC-03): the signed-in Member's data as JSON. */
export async function GET() {
  await connection();
  const member = await currentMember();
  if (!member) return new Response("Sign in first.", { status: 401 });
  const [profile, orders, stars] = await Promise.all([
    memberProfile(member.id),
    ordersForExport(member.id),
    starHistory(member.id),
  ]);
  return new Response(
    JSON.stringify(
      {
        exportedFrom: "Hoshikopi, a concept cafe (no real orders or money)",
        profile,
        orders,
        stars,
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="hoshikopi-my-data.json"',
        "Cache-Control": "no-store",
      },
    }
  );
}
