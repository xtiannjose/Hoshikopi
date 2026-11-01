import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { signUpForEvent } from "@/modules/content";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
// Latte art night has 12 Seats; the seed dates it a week from today.
const EVENT = "latte-art-night";

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock(new Date(Date.now() - 86_400_000));
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

let n = 0;
const person = (seats: number | string, email = `p${++n}@example.com`) => ({
  name: `Guest ${n}`,
  email,
  seats: String(seats),
});

describe("Event Sign-ups (EVT-02)", () => {
  it("takes Sign-ups until the Seats run out", async () => {
    expect(await signUpForEvent(EVENT, person(4))).toMatchObject({
      ok: true,
      seatsLeft: 8,
    });
    await signUpForEvent(EVENT, person(4));
    await signUpForEvent(EVENT, person(3));
    expect(await signUpForEvent(EVENT, person(2))).toEqual({
      ok: false,
      reason: "too_many_seats",
      seatsLeft: 1,
    });
    expect(await signUpForEvent(EVENT, person(1))).toMatchObject({
      ok: true,
      seatsLeft: 0,
    });
    expect(await signUpForEvent(EVENT, person(1))).toEqual({
      ok: false,
      reason: "full",
      seatsLeft: 0,
    });
  });

  it("takes one Sign-up per email per Event", async () => {
    await signUpForEvent(EVENT, person(1, "hoshi@example.com"));
    expect(await signUpForEvent(EVENT, person(2, "Hoshi@Example.com"))).toEqual(
      { ok: false, reason: "already" }
    );
  });

  it("is closed for an Event without Seats or one already over", async () => {
    expect(await signUpForEvent("open-mic-under-the-stars", person(1))).toEqual(
      { ok: false, reason: "closed" }
    );
    freezeClock("2099-01-01T00:00:00Z");
    expect(await signUpForEvent(EVENT, person(1))).toEqual({
      ok: false,
      reason: "closed",
    });
  });

  it("never oversells when two sign up for the last Seats at once", async () => {
    await signUpForEvent(EVENT, person(4));
    await signUpForEvent(EVENT, person(4));
    const results = await Promise.all([
      signUpForEvent(EVENT, person(3)),
      signUpForEvent(EVENT, person(3)),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const taken = await db.eventSignup.aggregate({ _sum: { seats: true } });
    expect(taken._sum.seats).toBe(11);
  });

  it("refuses unclear details", async () => {
    const result = await signUpForEvent(EVENT, {
      name: " ",
      email: "hoshi",
      seats: "5",
    });
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(
      Object.keys(!result.ok && "errors" in result ? result.errors : {})
    ).toEqual(["name", "email", "seats"]);
  });
});
