import { dayValue, manila } from "@/lib/clock";
import { db } from "@/lib/db";
import { getOrderingDay, prepMinutes } from "@/modules/cafe";
import { closeCheckout } from "@/modules/payments";

import { transition } from "./status";
import { drinksQueuedAhead } from "./windows";

export const PAYMENT_MINUTES = 15;

/**
 * Expire online Orders still unpaid after 15 minutes, freeing their windows
 * (PAY-04). Runs on read (Bar Screen, checkout) and in the daily cron,
 * because cron on Vercel Hobby runs once a day (ADR 0007).
 */
export async function expireUnpaid(at: Date): Promise<number> {
  const stale = await db.order.findMany({
    where: {
      status: "placed",
      paymentMethod: { not: "pay_at_pickup" },
      placedAt: { lt: new Date(at.getTime() - PAYMENT_MINUTES * 60_000) },
    },
    select: { id: true },
  });
  let expired = 0;
  for (const { id } of stale) {
    if ((await transition(id, "expired", { kind: "system" })).ok) {
      await closeCheckout(id);
      expired++;
    }
  }
  return expired;
}

export type BarOrder = {
  id: string;
  code: string;
  status: "placed" | "paid" | "accepted" | "preparing" | "ready";
  firstName: string;
  pickupKind: "asap" | "scheduled";
  windowStart: Date;
  placedAt: Date;
  payAtPickup: boolean;
  /** ASAP, or a Scheduled Order whose Pickup Time minus Prep Time has come. */
  makeNext: boolean;
  lines: {
    quantity: number;
    name: string;
    options: string[];
    note: string | null;
  }[];
};

export type BarBoard = {
  version: string;
  orders: BarOrder[];
  paused: { until: Date; message: string | null } | null;
};

/** Today's live Orders for the Bar Screen, by Pickup Time (STAFF-02). */
export async function barBoard(at: Date): Promise<BarBoard> {
  await expireUnpaid(at);
  const day = await getOrderingDay(at);
  const prep = prepMinutes(await drinksQueuedAhead(db, day.day), day.prep);
  const rows = await db.order.findMany({
    where: {
      serviceDay: dayValue(manila(at).day),
      OR: [
        { status: { in: ["paid", "accepted", "preparing", "ready"] } },
        { status: "placed", paymentMethod: "pay_at_pickup" },
      ],
    },
    orderBy: [{ windowStart: "asc" }, { placedAt: "asc" }],
    include: { lines: { orderBy: { createdAt: "asc" } } },
  });
  const paused =
    day.pausedUntil && day.pausedUntil > at
      ? { until: day.pausedUntil, message: day.pauseMessage }
      : null;
  const latest = rows.reduce(
    (max, o) => Math.max(max, o.updatedAt.getTime()),
    0
  );
  return {
    version: `${rows.length}:${latest}:${paused?.until.getTime() ?? 0}`,
    paused,
    orders: rows.map((order) => ({
      id: order.id,
      code: order.code,
      status: order.status as BarOrder["status"],
      firstName: order.customerName.trim().split(/\s+/)[0],
      pickupKind: order.pickupKind,
      windowStart: order.windowStart,
      placedAt: order.placedAt,
      payAtPickup: order.paymentMethod === "pay_at_pickup",
      makeNext:
        order.pickupKind === "asap" ||
        order.windowStart.getTime() - prep * 60_000 <= at.getTime(),
      lines: order.lines.map((line) => ({
        quantity: line.quantity,
        name: line.name,
        options: (line.options as { name: string }[]).map((o) => o.name),
        note: line.note,
      })),
    })),
  };
}
