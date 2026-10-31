import { revalidateTag } from "next/cache";
import { connection } from "next/server";

import { now } from "@/lib/clock";
import { expireUnpaid } from "@/modules/ordering";

/**
 * Once a day before opening (Vercel Cron, docs/03 section 12): expire what
 * the sweeps on read missed and refresh the menu so yesterday's Sold Out
 * marks clear. Order Codes restart by themselves each service day.
 */
export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Not allowed", { status: 401 });
  }
  const expired = await expireUnpaid(now());
  revalidateTag("menu", "max");
  return Response.json({ expired });
}
