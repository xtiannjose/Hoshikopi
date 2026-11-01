import { cacheLife, cacheTag } from "next/cache";

import { manila, manilaInstant, now } from "@/lib/clock";
import { db } from "@/lib/db";
import { addDays } from "@/lib/hours";

/** Midnight in Manila at the start of a window of `days` days ending today. */
function windowStart(days: number): Date {
  return manilaInstant(addDays(manila(now()).day, 1 - days), 0);
}

export type SalesReport = {
  days: { day: string; orders: number; totalCents: number }[];
  totals: { orders: number; totalCents: number };
  topItems: { name: string; quantity: number; totalCents: number }[];
  outcomes: { cancelled: number; expired: number; refunded: number };
};

/**
 * Reports for the Manager (STAFF-08): Picked Up Orders by the Manila day they
 * were placed, the top Menu Items by name as ordered, and how many Orders
 * were cancelled, expired or refunded, over the last `days` days.
 */
export async function salesReport(days: number): Promise<SalesReport> {
  const since = windowStart(days);
  const [byDay, topItems, outcomes] = await Promise.all([
    db.$queryRaw<SalesReport["days"]>`
      SELECT to_char((placed_at AT TIME ZONE 'Asia/Manila')::date, 'YYYY-MM-DD') AS day,
             count(*)::int AS orders, sum(total_cents)::int AS "totalCents"
      FROM orders
      WHERE status = 'picked_up' AND placed_at >= ${since}
      GROUP BY 1 ORDER BY 1 DESC`,
    db.$queryRaw<SalesReport["topItems"]>`
      SELECT l.name, sum(l.quantity)::int AS quantity,
             sum(l.line_cents)::int AS "totalCents"
      FROM order_lines l JOIN orders o ON o.id = l.order_id
      WHERE o.status = 'picked_up' AND o.placed_at >= ${since}
      GROUP BY l.name ORDER BY quantity DESC, "totalCents" DESC, l.name
      LIMIT 10`,
    db.order.groupBy({
      by: ["status"],
      where: {
        placedAt: { gte: since },
        status: { in: ["cancelled", "expired", "refunded"] },
      },
      _count: true,
    }),
  ]);
  const count = (status: string) =>
    outcomes.find((row) => row.status === status)?._count ?? 0;
  return {
    days: byDay,
    totals: {
      orders: byDay.reduce((sum, row) => sum + row.orders, 0),
      totalCents: byDay.reduce((sum, row) => sum + row.totalCents, 0),
    },
    topItems,
    outcomes: {
      cancelled: count("cancelled"),
      expired: count("expired"),
      refunded: count("refunded"),
    },
  };
}

// Too few Orders make a "popular" list noise (research C-57).
const POPULAR_MIN_ORDERS = 5;

/**
 * Popular this week (MENU-09): the three most ordered drinks in the last 7
 * days, from Orders still standing; empty until enough Orders had drinks.
 * Names are as ordered; the page matches ids to today's menu.
 */
export async function popularDrinks(): Promise<
  { menuItemId: string; name: string }[]
> {
  const since = windowStart(7);
  const [{ orders }] = await db.$queryRaw<{ orders: number }[]>`
    SELECT count(DISTINCT o.id)::int AS orders
    FROM orders o JOIN order_lines l ON l.order_id = o.id
    WHERE l.is_drink AND o.placed_at >= ${since}
      AND o.status NOT IN ('cancelled', 'expired', 'refunded')`;
  if (orders < POPULAR_MIN_ORDERS) return [];
  return db.$queryRaw<{ menuItemId: string; name: string }[]>`
    SELECT l.menu_item_id AS "menuItemId", min(l.name) AS name
    FROM order_lines l JOIN orders o ON o.id = l.order_id
    WHERE l.is_drink AND l.menu_item_id IS NOT NULL AND o.placed_at >= ${since}
      AND o.status NOT IN ('cancelled', 'expired', 'refunded')
    GROUP BY l.menu_item_id
    ORDER BY sum(l.quantity) DESC, min(l.name)
    LIMIT 3`;
}

/** Popular this week for Home, refreshed hourly. */
export async function getPopularDrinks() {
  "use cache";
  cacheTag("orders");
  cacheLife("hours");
  return popularDrinks();
}
