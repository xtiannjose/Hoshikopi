import { now } from "@/lib/clock";
import { db } from "@/lib/db";

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
      name: input.name.trim().slice(0, 60),
      marketingOptIn: input.marketingOptIn,
      birthMonth:
        Number.isInteger(month) && month! >= 1 && month! <= 12 ? month : null,
    },
  });
}

/**
 * The last step of deleting an account (ACC-03): the user row stays so the
 * ledgers it once touched keep their keys, but it no longer holds a name or
 * email, and every way back in (sessions, Google links, pending sign-in
 * links) is removed.
 */
export async function forgetMember(memberId: string) {
  const user = await db.user.findUnique({ where: { id: memberId } });
  if (!user) return;
  await db.$transaction([
    db.session.deleteMany({ where: { userId: memberId } }),
    db.account.deleteMany({ where: { userId: memberId } }),
    db.verification.deleteMany({ where: { identifier: user.email } }),
    db.user.update({
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
    }),
  ]);
}
