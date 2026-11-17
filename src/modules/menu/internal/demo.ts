import { dayValue, manila } from "@/lib/clock";
import { db } from "@/lib/db";
import { addDays } from "@/lib/hours";

// The seeded demo Promo and Seasonal drink (prisma/seed-data.ts).
const DEMO_PROMO = "matcha-latte";
const DEMO_SEASONAL = "calamansi-honey-soda";

/**
 * Keeps the hosted demo's Promo and Seasonal drink current (Demo Mode, ADR
 * 0015): once the Promo has ended it runs again from yesterday for 30 days,
 * and a Seasonal drink past its last day gets 60 more. A Promo a Manager
 * took off stays off. The daily cron calls it in Demo Mode only. Returns
 * how many it renewed.
 */
export async function rollDemoMenu(at: Date): Promise<number> {
  const today = manila(at).day;
  const promo = await db.menuItem.updateMany({
    where: {
      slug: DEMO_PROMO,
      promoCents: { not: null },
      promoUntil: { lt: dayValue(today) },
    },
    data: {
      promoFrom: dayValue(addDays(today, -1)),
      promoUntil: dayValue(addDays(today, 30)),
    },
  });
  const seasonal = await db.menuItem.updateMany({
    where: { slug: DEMO_SEASONAL, availableUntil: { lt: dayValue(today) } },
    data: { availableUntil: dayValue(addDays(today, 60)) },
  });
  return promo.count + seasonal.count;
}
