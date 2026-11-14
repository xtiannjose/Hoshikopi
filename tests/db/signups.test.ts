import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import {
  cancelSignup,
  confirmSignup,
  signupForGuest,
  signUpForEvent,
} from "@/modules/content";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
// Latte art night has 12 Seats; the seed dates it a week from today.
const EVENT = "latte-art-night";

const start = Date.now() - 86_400_000;
/** `minutes` after the test's frozen start. */
const later = (minutes: number) =>
  freezeClock(new Date(start + minutes * 60_000));

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock(new Date(start));
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

  // It reached the Manager's mailto link as a cc and a body (SEC2-01).
  it("refuses an email with a query in it", async () => {
    expect(
      await signUpForEvent(EVENT, person(1, "x@y.zz?cc=a%40b.cc&body=hi"))
    ).toMatchObject({
      ok: false,
      reason: "invalid",
      errors: { email: "Enter an email address, like hoshi@example.com." },
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

  it("holds the Seats for 30 minutes until the email link confirms the Sign-up (8.7)", async () => {
    const waiting = await signUpForEvent(EVENT, person(4));
    if (!waiting.ok) throw new Error(waiting.reason);
    expect(waiting.seatsLeft).toBe(8);
    expect(
      await signupForGuest(waiting.signup.id, waiting.token)
    ).toMatchObject({ confirmed: false, expired: false, seats: 4 });

    later(31);
    expect(await signUpForEvent(EVENT, person(1))).toMatchObject({
      ok: true,
      seatsLeft: 11,
    });
    expect(await confirmSignup(waiting.signup.id, waiting.token)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("confirms with the link token only, and keeps the Seats once confirmed", async () => {
    const mine = await signUpForEvent(EVENT, person(4, "hoshi@example.com"));
    if (!mine.ok) throw new Error(mine.reason);
    expect(await confirmSignup(mine.signup.id, "wrong")).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(await signupForGuest(mine.signup.id, "wrong")).toBeNull();

    later(5);
    expect(await confirmSignup(mine.signup.id, mine.token)).toEqual({
      ok: true,
    });
    expect(await confirmSignup(mine.signup.id, mine.token)).toEqual({
      ok: true,
    });
    later(120);
    expect(await signUpForEvent(EVENT, person(1))).toMatchObject({
      ok: true,
      seatsLeft: 7,
    });
    expect(await signupForGuest(mine.signup.id, mine.token)).toMatchObject({
      confirmed: true,
      event: { slug: EVENT },
    });
  });

  it("cancels with the link token, giving the Seats back", async () => {
    const mine = await signUpForEvent(EVENT, person(4, "hoshi@example.com"));
    if (!mine.ok) throw new Error(mine.reason);
    await confirmSignup(mine.signup.id, mine.token);
    expect(await cancelSignup(mine.signup.id, "wrong")).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(await cancelSignup(mine.signup.id, mine.token)).toEqual({
      ok: true,
      slug: EVENT,
    });
    expect(await signupForGuest(mine.signup.id, mine.token)).toBe("cancelled");
    // The Seats are free, and the same email can sign up again.
    expect(
      await signUpForEvent(EVENT, person(4, "hoshi@example.com"))
    ).toMatchObject({ ok: true, seatsLeft: 8 });
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
