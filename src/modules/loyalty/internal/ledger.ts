import type { Prisma } from "@/generated/prisma/client";
import { manila, manilaInstant, now } from "@/lib/clock";
import { db, type Client } from "@/lib/db";
import { addDays } from "@/lib/hours";
import { audit } from "@/modules/identity";

import { STARS_PER_REWARD } from "./rules";

// The Star ledger (ADR 0008): every change is a star_entries row and the
// balance is their sum. Changes lock the Member's row so two at once cannot
// take the balance below zero.

/** A Member's Star balance (LOY-05). */
export async function balance(memberId: string, client: Client = db) {
  const sum = await client.starEntry.aggregate({
    _sum: { stars: true },
    where: { memberId },
  });
  return sum._sum.stars ?? 0;
}

/** Every Star change, newest first. */
export async function starHistory(memberId: string) {
  return db.starEntry.findMany({
    where: { memberId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      kind: true,
      stars: true,
      orderId: true,
      reason: true,
      createdAt: true,
    },
  });
}

const lockMember = (tx: Prisma.TransactionClient, memberId: string) =>
  tx.$queryRaw`SELECT id FROM users WHERE id = ${memberId} FOR UPDATE`;

/**
 * An Order was Picked Up: 1 Star per drink (LOY-01). The ordering module
 * calls this inside the transition's transaction and counts the drinks.
 */
export async function earnForOrder(
  tx: Prisma.TransactionClient,
  order: { id: string; memberId: string | null; drinks: number }
) {
  if (!order.memberId || order.drinks <= 0) return;
  await tx.starEntry.create({
    data: {
      memberId: order.memberId,
      orderId: order.id,
      kind: "earn",
      stars: order.drinks,
    },
  });
}

/**
 * A picked-up Order was Refunded: take back what it earned, but never take
 * the balance below zero (Stars already spent stay spent).
 */
export async function reverseForOrder(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const earned = await tx.starEntry.findMany({
    where: { orderId, kind: { in: ["earn", "reverse"] } },
  });
  const net = earned.reduce((sum, e) => sum + e.stars, 0);
  const memberId = earned[0]?.memberId;
  if (!memberId || net <= 0) return;
  await lockMember(tx, memberId);
  const take = Math.min(net, await balance(memberId, tx));
  if (take <= 0) return;
  await tx.starEntry.create({
    data: { memberId, orderId, kind: "reverse", stars: -take },
  });
}

export type AdjustResult =
  | { ok: true }
  | { ok: false; reason: "not_allowed" | "reason_required" | "below_zero" };

/** A Manager adds or removes Stars, with a reason (LOY-05). */
export async function adjustStars(
  memberId: string,
  stars: number,
  reason: string,
  actor: { kind: string; id?: string; role?: string }
): Promise<AdjustResult> {
  if (actor.kind !== "staff" || actor.role !== "manager" || !actor.id) {
    return { ok: false, reason: "not_allowed" };
  }
  const why = reason.trim();
  if (!why) return { ok: false, reason: "reason_required" };
  if (!Number.isInteger(stars) || stars === 0) {
    return { ok: false, reason: "reason_required" };
  }
  const managerId = actor.id;
  return db.$transaction(async (tx): Promise<AdjustResult> => {
    await lockMember(tx, memberId);
    if ((await balance(memberId, tx)) + stars < 0) {
      return { ok: false, reason: "below_zero" };
    }
    await tx.starEntry.create({
      data: {
        memberId,
        kind: "adjust",
        stars,
        reason: why,
        actorId: managerId,
      },
    });
    await audit(
      { id: managerId },
      "loyalty.adjust",
      { type: "user", id: memberId },
      { stars, reason: why },
      tx
    );
    return { ok: true };
  });
}

/**
 * Lock the Member's row and check they hold a Reward's worth of Stars. The
 * lock holds until the caller's transaction ends, so a Redemption recorded
 * in it cannot be spent twice (ADR 0008).
 */
export async function canRedeem(
  tx: Prisma.TransactionClient,
  memberId: string
): Promise<boolean> {
  await lockMember(tx, memberId);
  return (await balance(memberId, tx)) >= STARS_PER_REWARD;
}

/** Reserve the Stars for a Reward in an Order (after canRedeem, LOY-03). */
export async function reserveRedemption(
  tx: Prisma.TransactionClient,
  memberId: string,
  orderId: string
) {
  await tx.starEntry.create({
    data: { memberId, orderId, kind: "reserve", stars: -STARS_PER_REWARD },
  });
}

/** Give a cancelled or expired Order's reserved Stars back, once. */
export async function releaseRedemption(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const entries = await tx.starEntry.findMany({
    where: { orderId, kind: { in: ["reserve", "release"] } },
  });
  const held = -entries.reduce((sum, e) => sum + e.stars, 0);
  if (held <= 0) return;
  await tx.starEntry.create({
    data: {
      memberId: entries[0].memberId,
      orderId,
      kind: "release",
      stars: held,
    },
  });
}

/** Deleting an account forgets its Star history (ACC-03). */
export async function forgetStars(memberId: string) {
  await db.starEntry.deleteMany({ where: { memberId } });
}

/**
 * The Birthday Treat (LOY-04): in the Member's birthday month (Manila
 * calendar), once a year, 9 Stars, which is one free drink through the usual
 * Reward. Granted when the Member opens their account or checkout that month;
 * "given" when it already was this year; null outside the month.
 */
export async function birthdayTreat(
  memberId: string,
  birthMonth: number | null
): Promise<"granted" | "given" | null> {
  const at = now();
  const [year, month] = manila(at).day.split("-").map(Number);
  if (birthMonth !== month) return null;
  return db.$transaction(async (tx) => {
    await lockMember(tx, memberId);
    const given = await tx.starEntry.findFirst({
      where: {
        memberId,
        kind: "birthday",
        createdAt: { gte: manilaInstant(`${year}-01-01`, 0) },
      },
    });
    if (given) return "given";
    await tx.starEntry.create({
      data: {
        memberId,
        kind: "birthday",
        stars: STARS_PER_REWARD,
        reason: `Birthday Treat ${year}`,
        createdAt: at,
      },
    });
    return "granted";
  });
}

/**
 * Stars for the Manager's report (STAFF-08) over the last `days` days:
 * earned on Orders, Birthday Treats, redeemed for free drinks (reserved less
 * released), taken back on Refunds, and the Manager's adjustments.
 */
export async function starTotals(days: number) {
  const since = manilaInstant(addDays(manila(now()).day, 1 - days), 0);
  const rows = await db.starEntry.groupBy({
    by: ["kind"],
    where: { createdAt: { gte: since } },
    _sum: { stars: true },
  });
  const sum = (kind: string) =>
    rows.find((row) => row.kind === kind)?._sum.stars ?? 0;
  return {
    earned: sum("earn"),
    birthday: sum("birthday"),
    redeemed: -(sum("reserve") + sum("release")),
    takenBack: -sum("reverse"),
    adjusted: sum("adjust"),
  };
}
