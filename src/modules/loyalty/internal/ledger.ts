import type { Prisma } from "@/generated/prisma/client";
import { db, type Client } from "@/lib/db";
import { audit } from "@/modules/identity";

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
