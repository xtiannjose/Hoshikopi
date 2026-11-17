import { now } from "@/lib/clock";
import { db, inTransaction, type Client } from "@/lib/db";
import { withoutControl } from "@/lib/text";

export type MemberProfile = {
  name: string;
  email: string;
  marketingOptIn: boolean;
  /** 1 to 12, for the Birthday Treat (LOY-04); null when not given. */
  birthMonth: number | null;
  createdAt: Date;
};

/** Your details: what the account page shows and the export includes. */
export async function memberProfile(
  memberId: string
): Promise<MemberProfile | null> {
  return db.user.findFirst({
    where: { id: memberId, deletedAt: null },
    select: {
      name: true,
      email: true,
      marketingOptIn: true,
      birthMonth: true,
      createdAt: true,
    },
  });
}

/** A Member's name, birth month and separate marketing opt-in (ACC-03). */
export async function updateProfile(
  memberId: string,
  input: { name: string; marketingOptIn: boolean; birthMonth: number | null }
) {
  const month = input.birthMonth;
  await db.user.update({
    where: { id: memberId },
    data: {
      name: withoutControl(input.name).trim().slice(0, 60),
      marketingOptIn: input.marketingOptIn,
      birthMonth:
        Number.isInteger(month) && month! >= 1 && month! <= 12 ? month : null,
    },
  });
}

/**
 * A Staff account's role, or null for a Customer. Deleting an account
 * calls it first: a Staff account is not deleted from /account, or the only
 * Manager could leave nobody to run the cafe (PRD STAFF-10, audit DC-01).
 * It locks the row, as setRole does, so a role given at the same moment
 * waits.
 */
export async function staffRoleFor(memberId: string, client: Client = db) {
  const [row] = await client.$queryRaw<{ role: string }[]>`
    SELECT role FROM users WHERE id = ${memberId} FOR UPDATE`;
  return row && row.role !== "customer" ? row.role : null;
}

/**
 * The last step of deleting an account (ACC-03): the user row stays so the
 * ledgers it once touched keep their keys, but it no longer holds a name or
 * email, and every way back in (sessions, Google links, pending sign-in
 * links) is removed.
 */
export async function forgetMember(memberId: string, client: Client = db) {
  await inTransaction(client, async (tx) => {
    const user = await tx.user.findUnique({ where: { id: memberId } });
    if (!user) return;
    await tx.session.deleteMany({ where: { userId: memberId } });
    await tx.account.deleteMany({ where: { userId: memberId } });
    // Better Auth keys a sign-in link "magic-link:<token hash>" and keeps
    // the email in its JSON value (audit ID2-03).
    await tx.verification.deleteMany({
      where: {
        identifier: { startsWith: "magic-link:" },
        value: { contains: `"email":${JSON.stringify(user.email)}` },
      },
    });
    // Its sign-in limits name the email, one with the IP it came from.
    await tx.rateLimit.deleteMany({
      where: {
        OR: [
          { key: `link:${user.email}` },
          { key: { startsWith: `link-pair:${user.email}:` } },
        ],
      },
    });
    await tx.user.update({
      where: { id: memberId },
      data: {
        name: "",
        email: `deleted-${memberId}@hoshikopi.invalid`,
        emailVerified: false,
        image: null,
        birthMonth: null,
        marketingOptIn: false,
        deletedAt: now(),
      },
    });
  });
}
