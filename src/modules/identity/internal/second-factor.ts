import { createOTP } from "@better-auth/utils/otp";
import {
  constantTimeEqual,
  generateRandomString,
  symmetricDecrypt,
  symmetricEncrypt,
} from "better-auth/crypto";

import { now } from "@/lib/clock";
import { db } from "@/lib/db";
import { takeToken } from "@/lib/rate-limit";

import { audit } from "./audit";

// Staff Second Factor (ADR 0014): TOTP, 6 digits every 30 seconds, the
// secret encrypted with the auth secret as Better Auth's own plugin does.
const ISSUER = "Hoshikopi";
const PERIOD_MS = 30_000;

const key = () => process.env.BETTER_AUTH_SECRET ?? "";

async function otpFor(encrypted: string) {
  return createOTP(await symmetricDecrypt({ key: key(), data: encrypted }));
}

export type SecondFactorEnrolment = { uri: string; setupKey: string };

/**
 * The authenticator details for Staff who have not confirmed a Second Factor
 * yet, or null once they have. A pending secret is kept, so a reload (or two
 * tabs) shows the same one.
 */
export async function secondFactorEnrolment(
  userId: string,
  email: string
): Promise<SecondFactorEnrolment | null> {
  const secret = await symmetricEncrypt({
    key: key(),
    data: generateRandomString(32),
  });
  await db.secondFactor.createMany({
    data: [{ userId, secret }],
    skipDuplicates: true,
  });
  const row = await db.secondFactor.findUniqueOrThrow({ where: { userId } });
  if (row.confirmedAt) return null;
  const uri = (await otpFor(row.secret)).url(ISSUER, email);
  return { uri, setupKey: new URL(uri).searchParams.get("secret")! };
}

export type SecondFactorResult = "ok" | "wrong" | "too_many";

/**
 * Checks a code from the authenticator app. A match passes this session and,
 * the first time, confirms the enrolment. Every try counts toward the limit.
 */
export async function enterSecondFactor(
  userId: string,
  sessionId: string,
  code: string
): Promise<SecondFactorResult> {
  if (!(await takeToken(`second-factor:${userId}`, 10, 15 * 60))) {
    return "too_many";
  }
  const row = await db.secondFactor.findUnique({ where: { userId } });
  if (!row || !/^\d{6}$/.test(code)) return "wrong";
  const otp = await otpFor(row.secret);
  const at = now();
  const step = Math.floor(at.getTime() / PERIOD_MS);
  // One step either side allows for a phone clock a little off.
  let match = false;
  for (const counter of [step - 1, step, step + 1]) {
    match = constantTimeEqual(await otp.hotp(counter), code) || match;
  }
  if (!match) return "wrong";
  await db.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: sessionId, userId },
      data: { secondFactorAt: at },
    });
    const confirmed = await tx.secondFactor.updateMany({
      where: { userId, confirmedAt: null },
      data: { confirmedAt: at },
    });
    if (confirmed.count) {
      await audit(
        { id: userId },
        "second_factor.confirm",
        {
          type: "user",
          id: userId,
        },
        {},
        tx
      );
    }
  });
  return "ok";
}

/** True once Staff entered their Second Factor in this session. */
export async function secondFactorPassed(sessionId: string): Promise<boolean> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { secondFactorAt: true },
  });
  return !!session?.secondFactorAt;
}
