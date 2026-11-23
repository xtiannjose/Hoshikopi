import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { rollDemoEvents } from "@/modules/content";
import { rollDemoMenu } from "@/modules/menu";

import { createTestDb, resetToSeed } from "./helpers";

const db = createTestDb();
const at = (day: string, hhmm: string) => new Date(`${day}T${hhmm}:00+08:00`);
// 9 AM Monday Nov 2 in Manila.
const MONDAY_9AM = at("2026-11-02", "09:00");

beforeEach(async () => {
  await resetToSeed(db);
  freezeClock(MONDAY_9AM);
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

// The live demo's Events and Promo went stale and someone had to re-date
// them by hand (owner request, Phase 10).
describe("rollDemoEvents", () => {
  it("moves a past demo Event forward by whole weeks and clears its Sign-ups", async () => {
    // A Tuesday, 7 PM Manila, three weeks back.
    const startsAt = at("2026-10-13", "19:00");
    const event = await db.event.update({
      where: { slug: "latte-art-night" },
      data: { startsAt, endsAt: at("2026-10-13", "21:00") },
    });
    await db.eventSignup.create({
      data: {
        eventId: event.id,
        name: "Old guest",
        email: "old@example.com",
        seats: 2,
      },
    });
    const owner = await db.event.create({
      data: {
        slug: "owner-cupping",
        title: "Owner cupping",
        startsAt,
        endsAt: at("2026-10-13", "21:00"),
        summary: "One line.",
        bodyMd: "Body.",
        isPublished: true,
      },
    });
    const later = await db.event.findUniqueOrThrow({
      where: { slug: "open-mic-under-the-stars" },
    });

    expect(await rollDemoEvents(MONDAY_9AM)).toBe(1);

    const rolled = await db.event.findUniqueOrThrow({
      where: { id: event.id },
    });
    // The next Tuesday at 7 PM, still two hours long.
    expect(rolled.startsAt).toEqual(at("2026-11-03", "19:00"));
    expect(rolled.endsAt).toEqual(at("2026-11-03", "21:00"));
    expect(await db.eventSignup.count({ where: { eventId: event.id } })).toBe(
      0
    );
    // The owner's own Event and a demo Event still ahead stay as they are.
    expect(
      (await db.event.findUniqueOrThrow({ where: { id: owner.id } })).startsAt
    ).toEqual(startsAt);
    expect(
      (await db.event.findUniqueOrThrow({ where: { id: later.id } })).startsAt
    ).toEqual(later.startsAt);
  });

  // Seeded two weeks apart on the same weekday, both demo Events rolled to
  // the same Saturday at 7 PM, which looks made up (unslop pass, 14.2).
  it("never puts the two demo Events on the same evening", async () => {
    for (const slug of ["latte-art-night", "open-mic-under-the-stars"]) {
      await db.event.update({
        where: { slug },
        data: {
          startsAt: at("2026-10-24", "19:00"),
          endsAt: at("2026-10-24", "21:00"),
        },
      });
    }
    expect(await rollDemoEvents(MONDAY_9AM)).toBe(2);

    const days = (
      await db.event.findMany({
        where: {
          slug: { in: ["latte-art-night", "open-mic-under-the-stars"] },
        },
        orderBy: { startsAt: "asc" },
      })
    ).map((event) => event.startsAt);
    // Both stay Saturdays at 7 PM, a week apart.
    expect(days).toEqual([
      at("2026-11-07", "19:00"),
      at("2026-11-14", "19:00"),
    ]);
  });
});

describe("rollDemoMenu", () => {
  it("renews an ended demo Promo and Seasonal date, and leaves a removed Promo off", async () => {
    await db.menuItem.update({
      where: { slug: "matcha-latte" },
      data: {
        promoFrom: new Date("2026-09-01"),
        promoUntil: new Date("2026-10-01"),
      },
    });
    await db.menuItem.update({
      where: { slug: "calamansi-honey-soda" },
      data: { availableUntil: new Date("2026-10-15") },
    });

    expect(await rollDemoMenu(MONDAY_9AM)).toBe(2);

    const promo = await db.menuItem.findUniqueOrThrow({
      where: { slug: "matcha-latte" },
    });
    expect(promo.promoFrom).toEqual(new Date("2026-11-01"));
    expect(promo.promoUntil).toEqual(new Date("2026-12-02"));
    expect(
      (
        await db.menuItem.findUniqueOrThrow({
          where: { slug: "calamansi-honey-soda" },
        })
      ).availableUntil
    ).toEqual(new Date("2027-01-01"));

    // A Manager who takes the Promo off keeps it off.
    await db.menuItem.update({
      where: { slug: "matcha-latte" },
      data: { promoCents: null, promoFrom: null, promoUntil: null },
    });
    expect(await rollDemoMenu(MONDAY_9AM)).toBe(0);
  });
});
