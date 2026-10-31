import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getOrderingDay } from "@/modules/cafe";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const time = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00Z`);
// 9 AM Sunday Nov 1 and Monday Nov 2 in Manila.
const SUNDAY = new Date("2026-11-01T01:00:00Z");
const MONDAY = new Date("2026-11-02T01:00:00Z");

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db, { people: false });
});
afterAll(() => db.$disconnect());

describe("getOrderingDay", () => {
  it("reads the weekday's hours, Capacity and the Prep Time settings", async () => {
    expect(await getOrderingDay(MONDAY)).toEqual({
      day: "2026-11-02",
      hours: { opensAt: "07:00", lastOrderAt: "20:30", closesAt: "21:00" },
      capacity: { drinks: 12, food: 8 },
      pausedUntil: null,
      pauseMessage: null,
      prep: { baseMinutes: 4, perDrinkMinutes: 1.5 },
    });
  });

  it("uses Capacity set for that day of the week", async () => {
    await db.capacityRule.update({
      where: { weekday: 0 },
      data: { drinksPerWindow: 20, foodPerWindow: 10 },
    });
    expect((await getOrderingDay(SUNDAY)).capacity).toEqual({
      drinks: 20,
      food: 10,
    });
  });

  it("lets Special Hours shorten or close a day", async () => {
    await db.specialHours.create({
      data: {
        day: new Date("2026-11-01"),
        isClosed: false,
        opensAt: time("10:00"),
        lastOrderAt: time("17:30"),
        closesAt: time("18:00"),
        note: "All Saints' Day",
      },
    });
    await db.specialHours.create({
      data: { day: new Date("2026-11-02"), isClosed: true },
    });
    expect((await getOrderingDay(SUNDAY)).hours).toMatchObject({
      opensAt: "10:00",
      closesAt: "18:00",
    });
    expect((await getOrderingDay(MONDAY)).hours).toBeNull();
  });

  it("carries Ordering Paused", async () => {
    const until = new Date("2026-11-02T02:00:00Z");
    await db.cafeSettings.update({
      where: { id: 1 },
      data: { orderingPausedUntil: until, pauseMessage: "Back at 10!" },
    });
    expect(await getOrderingDay(MONDAY)).toMatchObject({
      pausedUntil: until,
      pauseMessage: "Back at 10!",
    });
  });
});
