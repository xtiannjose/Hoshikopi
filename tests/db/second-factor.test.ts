import { createHmac } from "node:crypto";

import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { enterSecondFactor, secondFactorEnrolment } from "@/modules/identity";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const HOSHI = "seed-manager";
const EMAIL = "hoshi@hoshikopi.example";
const AT = new Date("2026-11-02T01:00:00Z");

/** What an authenticator app shows for `uri` at `at` (RFC 6238, SHA-1, 30 s). */
function appCode(uri: string, at: Date): string {
  const secret = new URL(uri).searchParams.get("secret")!;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret]
    .map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0"))
    .join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at.getTime() / 30_000)));
  const mac = createHmac("sha1", key).update(counter).digest();
  const offset = mac[19] & 15;
  const value = (mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(value).padStart(6, "0");
}

async function newSession(id: string) {
  await db.session.create({
    data: {
      id,
      token: `token-${id}`,
      expiresAt: new Date("2026-11-09T00:00:00Z"),
      userId: HOSHI,
    },
  });
  return id;
}

async function passedAt(sessionId: string) {
  const session = await db.session.findUniqueOrThrow({
    where: { id: sessionId },
  });
  return session.secondFactorAt;
}

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock(AT);
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

describe("Second Factor (ADR 0014)", () => {
  it("keeps the same setup key until a code confirms it", async () => {
    const first = await secondFactorEnrolment(HOSHI, EMAIL);
    const again = await secondFactorEnrolment(HOSHI, EMAIL);
    expect(first?.uri).toMatch(/^otpauth:\/\/totp\/Hoshikopi:hoshi%40/);
    expect(again?.uri).toBe(first?.uri);
  });

  it("passes the session and confirms enrolment with the app's code", async () => {
    const session = await newSession("s1");
    const { uri } = (await secondFactorEnrolment(HOSHI, EMAIL))!;

    expect(await enterSecondFactor(HOSHI, session, appCode(uri, AT))).toBe(
      "ok"
    );
    expect(await passedAt(session)).toEqual(AT);
    expect(await secondFactorEnrolment(HOSHI, EMAIL)).toBeNull();
  });

  it("allows a phone clock 30 seconds off, not 90", async () => {
    const { uri } = (await secondFactorEnrolment(HOSHI, EMAIL))!;
    const late = new Date(AT.getTime() - 30_000);
    const stale = new Date(AT.getTime() - 90_000);

    expect(
      await enterSecondFactor(HOSHI, await newSession("s1"), appCode(uri, late))
    ).toBe("ok");
    const s2 = await newSession("s2");
    expect(await enterSecondFactor(HOSHI, s2, appCode(uri, stale))).toBe(
      "wrong"
    );
    expect(await passedAt(s2)).toBeNull();
  });

  it("refuses a wrong code and a code before any enrolment", async () => {
    const session = await newSession("s1");
    expect(await enterSecondFactor(HOSHI, session, "123456")).toBe("wrong");

    const { uri } = (await secondFactorEnrolment(HOSHI, EMAIL))!;
    const right = appCode(uri, AT);
    const wrong = String((Number(right) + 1) % 1_000_000).padStart(6, "0");
    expect(await enterSecondFactor(HOSHI, session, wrong)).toBe("wrong");
    expect(await passedAt(session)).toBeNull();
    expect(await secondFactorEnrolment(HOSHI, EMAIL)).not.toBeNull();
  });

  it("refuses the 11th try in 15 minutes, even with the right code", async () => {
    const session = await newSession("s1");
    const { uri } = (await secondFactorEnrolment(HOSHI, EMAIL))!;
    for (let i = 0; i < 10; i++) {
      expect(await enterSecondFactor(HOSHI, session, "000000")).not.toBe("ok");
    }
    expect(await enterSecondFactor(HOSHI, session, appCode(uri, AT))).toBe(
      "too_many"
    );
    expect(await passedAt(session)).toBeNull();
  });
});
