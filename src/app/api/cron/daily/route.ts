import { revalidateTag } from "next/cache";
import { connection } from "next/server";

import { now } from "@/lib/clock";
import { sameSecret } from "@/lib/secret";
import { pruneRateLimits } from "@/lib/rate-limit";
import { pruneGuestCarts } from "@/modules/cart";
import { rollDemoEvents } from "@/modules/content";
import { rollDemoMenu } from "@/modules/menu";
import { demoMode } from "@/modules/payments";
import { cancelUncollected, expireUnpaid } from "@/modules/ordering";

/**
 * Once a day before opening (Vercel Cron, docs/03 section 12): expire what
 * the sweeps on read missed, cancel earlier days' Orders the bar never
 * accepted (Pay at Pickup ones nobody took, audit ORD-13; paid ones, which
 * are refunded, audit DC-07), and refresh the menu so yesterday's Sold Out
 * marks clear. Order Codes restart by themselves each service day.
 */
export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  if (!secret || !sameSecret(given, `Bearer ${secret}`)) {
    return new Response("Not allowed", { status: 401 });
  }
  const at = now();
  const expired = await expireUnpaid(at);
  const cancelled = await cancelUncollected(at);
  // Rate-limit rows hold emails and IPs; keep only the last day's.
  await pruneRateLimits(at);
  // Guest Carts past their cookie's 30 days (audit ops:9).
  await pruneGuestCarts(at);
  // The hosted demo's Events, Promo and Seasonal drink stay current
  // without anyone re-dating them (Demo Mode, ADR 0015).
  if (demoMode()) {
    if (await rollDemoEvents(at)) revalidateTag("events", { expire: 0 });
    await rollDemoMenu(at);
  }
  // Expired at once, so the first visitor after the job sees yesterday's
  // Sold Out cleared and the new dates; "max" served them the old page once
  // more (audit PERF-21).
  revalidateTag("menu", { expire: 0 });
  return Response.json({ expired, cancelled });
}
