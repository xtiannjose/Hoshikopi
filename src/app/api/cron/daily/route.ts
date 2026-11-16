import { revalidateTag } from "next/cache";
import { connection } from "next/server";

import { now } from "@/lib/clock";
import { pruneRateLimits } from "@/lib/rate-limit";
import { cancelUncollected, expireUnpaid } from "@/modules/ordering";

/**
 * Once a day before opening (Vercel Cron, docs/03 section 12): expire what
 * the sweeps on read missed, cancel earlier days' Pay at Pickup Orders
 * nobody took (audit ORD-13), and refresh the menu so yesterday's Sold Out
 * marks clear. Order Codes restart by themselves each service day.
 */
export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Not allowed", { status: 401 });
  }
  const at = now();
  const expired = await expireUnpaid(at);
  const cancelled = await cancelUncollected(at);
  // Rate-limit rows hold emails and IPs; keep only the last day's.
  await pruneRateLimits(at);
  revalidateTag("menu", "max");
  return Response.json({ expired, cancelled });
}
