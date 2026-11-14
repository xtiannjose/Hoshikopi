import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import {
  endBusyMode,
  getOrderingDay,
  pauseOrdering,
  resumeOrdering,
  saveCafeDetails,
  saveCapacity,
  saveSpecialHours,
  saveWeeklyHours,
  startBusyMode,
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

  it("refuses a day already gone (audit staff:5)", async () => {
    const result = await saveSpecialHours(
      { day: "2026-11-01", isClosed: true },
      christian
    );
    expect(result).toEqual({
      ok: false,
      errors: { day: "Choose today or a later date." },
    });
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

  // A cleared cell used to save 0 drinks: no Pickup Times that weekday.
  it("refuses blank cells and Prep Time finer than a tenth (audit staff:5)", async () => {
    const rows = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      drinks: weekday === 1 ? " " : "12",
      food: "8",
    }));
    expect(
      await saveCapacity(
        rows,
        { baseMinutes: "", perDrinkMinutes: "1.25" },
        christian
      )
    ).toEqual({
      ok: false,
      errors: {
        "1": "Use whole numbers from 0 to 200.",
        baseMinutes: "Use minutes from 0 to 60, like 4 or 1.5.",
        perDrinkMinutes: "Use minutes from 0 to 60, like 4 or 1.5.",
      },
    });
    expect(
      (await getOrderingDay(new Date(MONDAY_9AM))).capacity.drinks
    ).toBeGreaterThan(0);
  });
});

describe("Cafe details (STAFF-09)", () => {
  it("refuses a blank map pin instead of saving 0,0 (audit staff:5)", async () => {
    const result = await saveCafeDetails(
      { mapLat: "", mapLng: "121.03" },
      christian
    );
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toMatchObject({
      mapLat: "Enter the map pin.",
    });
    expect(!result.ok && result.errors.mapLng).toBeUndefined();
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

describe("Busy Mode (8.4)", () => {
  it("adds minutes to Prep Time for a while, then ends by itself", async () => {
    await startBusyMode(15, 60, christian);
    expect(await getOrderingDay(new Date(MONDAY_9AM))).toMatchObject({
      busy: { minutes: 15, until: new Date("2026-11-02T02:00:00Z") },
      prep: { baseMinutes: 4, perDrinkMinutes: 1.5, busyMinutes: 15 },
    });
    const later = await getOrderingDay(new Date("2026-11-02T02:00:00Z"));
    expect(later.busy).toBeNull();
    expect(later.prep.busyMinutes).toBe(0);
    expect(
      await db.auditLog.findFirst({
        where: { action: "cafe.busy.start" },
        select: { actorId: true, data: true },
      })
    ).toEqual({
      actorId: "seed-manager",
      data: { minutes: 15, forMinutes: 60 },
    });
  });

  it("can be ended early, and refuses odd amounts", async () => {
    await startBusyMode(10, 30, christian);
    await endBusyMode(christian);
    const day = await getOrderingDay(new Date(MONDAY_9AM));
    expect(day.busy).toBeNull();
    expect(day.prep.busyMinutes).toBe(0);
    expect(
      await db.auditLog.count({ where: { action: "cafe.busy.end" } })
    ).toBe(1);
    await expect(startBusyMode(45, 30, christian)).rejects.toThrow();
    await expect(startBusyMode(10, 600, christian)).rejects.toThrow();
  });
});
