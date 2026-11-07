import type { Role } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

import { audit } from "./audit";

// A lower rank is less access: losing access ends the person's sessions.
const RANK: Record<Role, number> = { customer: 0, barista: 1, manager: 2 };

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "barista" | "manager";
};

/** The Staff, Managers first, then by name (STAFF-10). */
export async function staffMembers(): Promise<StaffMember[]> {
  const rows = await db.user.findMany({
    where: { role: { in: ["manager", "barista"] }, deletedAt: null },
    select: { id: true, name: true, email: true, role: true },
    // Postgres orders an enum as declared: customer, barista, manager.
    orderBy: [{ role: "desc" }, { name: "asc" }],
  });
  return rows.map((row) => ({ ...row, role: row.role as StaffMember["role"] }));
}

export type RoleResult =
  | { ok: true; name: string }
  | { ok: false; reason: "not_found" | "self" | "not_allowed" };

/**
 * A Manager gives someone with an account a role: Barista, Manager, or back
 * to a Member (`customer`). Managers cannot change their own role, and the
 * actor must still be a Manager when the change runs, with every Manager row
 * locked, so the last Manager always stays, even when two Managers demote
 * each other at once. Losing access ends the person's sessions; every change
 * is logged (STAFF-01, STAFF-10).
 */
export async function setRole(
  actor: { id: string },
  email: string,
  role: Role
): Promise<RoleResult> {
  return db.$transaction(async (tx) => {
    const managers = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM users WHERE role = 'manager' AND deleted_at IS NULL
      ORDER BY id FOR UPDATE`;
    if (!managers.some((m) => m.id === actor.id)) {
      return { ok: false, reason: "not_allowed" };
    }
    const person = await tx.user.findFirst({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
      select: { id: true, name: true, role: true },
    });
    if (!person) return { ok: false, reason: "not_found" };
    if (person.id === actor.id) return { ok: false, reason: "self" };
    if (person.role !== role) {
      await tx.user.update({ where: { id: person.id }, data: { role } });
      if (RANK[role] < RANK[person.role]) {
        await tx.session.deleteMany({ where: { userId: person.id } });
      }
      await audit(
        actor,
        "identity.role.update",
        { type: "user", id: person.id },
        { from: person.role, to: role },
        tx
      );
    }
    return { ok: true, name: person.name };
  });
}

/** A Manager signs someone else out everywhere (STAFF-10); logged. */
export async function endSessions(
  actor: { id: string },
  userId: string
): Promise<{ ok: true } | { ok: false; reason: "self" | "not_allowed" }> {
  if (userId === actor.id) return { ok: false, reason: "self" };
  const manager = await db.user.findFirst({
    where: { id: actor.id, role: "manager", deletedAt: null },
    select: { id: true },
  });
  if (!manager) return { ok: false, reason: "not_allowed" };
  await db.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId } });
    await audit(
      actor,
      "identity.sessions.end",
      { type: "user", id: userId },
      {},
      tx
    );
  });
  return { ok: true };
}
