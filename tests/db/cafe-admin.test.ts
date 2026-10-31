import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import {
  getOrderingDay,
  pauseOrdering,
  resumeOrdering,
  saveCapacity,
  saveSpecialHours,
  saveWeeklyHours,
} from "@/modules/cafe";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const christian = {
  id: "seed-manager",
  name: "Christian",
  role: "manager" as const,
};
const MONDAY_9AM = "2026-11-02T01:00:00Z";

const everyDay = (change: Record<string, string> = {}) =>
  [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    isClosed: false,
    opensAt: "07:00",
    lastOrderAt: "20:30",
    closesAt: "21:00",
    ...(weekday === 1 ? change : {}),
  }));

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db, { people: false });
  freezeClock(MONDAY_9AM);
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

describe("Opening Hours (STAFF-05)", () => {
  it("saves a day's new hours", async () => {
    expect(
      await saveWeeklyHours(everyDay({ opensAt: "08:00" }), christian)
    ).toEqual({
      ok: true,
    });
    expect((await getOrderingDay(new Date(MONDAY_9AM))).hours?.opensAt).toBe(
      "08:00"
    );
  });

  it("refuses Last Order after closing", async () => {
    const result = await saveWeeklyHours(
      everyDay({ lastOrderAt: "21:30" }),
      christian
    );
    expect(result).toEqual({
      ok: false,
      errors: { "1": "Last order must be after opening and by closing." },
    });
  });
});

describe("Special Hours", () => {
  it("closes one day", async () => {
    await saveSpecialHours(
      { day: "2026-11-02", isClosed: true, note: "Staff day out" },
      christian
    );
    expect((await getOrderingDay(new Date(MONDAY_9AM))).hours).toBeNull();
  });
});

describe("Capacity", () => {
  it("saves drinks and food Lines per window for each weekday", async () => {
    const rows = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      drinks: weekday === 1 ? "15" : "12",
      food: "8",
    }));
    expect(
      await saveCapacity(
        rows,
        { baseMinutes: "3", perDrinkMinutes: "2" },
        christian
      )
    ).toEqual({ ok: true });
    expect(await getOrderingDay(new Date(MONDAY_9AM))).toMatchObject({
      capacity: { drinks: 15, food: 8 },
      prep: { baseMinutes: 3, perDrinkMinutes: 2 },
    });
  });
});

describe("Ordering Paused", () => {
  it("pauses for a while with a message, then resumes", async () => {
    await pauseOrdering(30, "The bar is swamped. Back soon!", christian);
    expect(await getOrderingDay(new Date(MONDAY_9AM))).toMatchObject({
      pausedUntil: new Date("2026-11-02T01:30:00Z"),
      pauseMessage: "The bar is swamped. Back soon!",
    });
    await resumeOrdering(christian);
    expect((await getOrderingDay(new Date(MONDAY_9AM))).pausedUntil).toBeNull();
  });
});
