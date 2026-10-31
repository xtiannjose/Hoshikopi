import { describe, expect, it } from "vitest";

import {
  orderingState,
  pickupWindows,
  prepMinutes,
  type OrderingDay,
} from "./ordering-day";

const PREP = { baseMinutes: 4, perDrinkMinutes: 1.5 };

describe("prepMinutes (Prep Time, ADR 0007)", () => {
  it("is the base time rounded up to 5 minutes with no queue", () => {
    expect(prepMinutes(0, PREP)).toBe(5);
  });
  it("adds time per drink queued ahead, rounded up to 5 minutes", () => {
    expect(prepMinutes(4, PREP)).toBe(10); // 4 + 6 = 10
    expect(prepMinutes(5, PREP)).toBe(15); // 4 + 7.5 = 11.5
  });
});

// Manila is UTC+8; at() reads a Manila wall-clock time on Monday Nov 2.
const at = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00+08:00`);

const DAY: OrderingDay = {
  day: "2026-11-02",
  hours: { opensAt: "07:00", lastOrderAt: "20:30", closesAt: "21:00" },
  capacity: { drinks: 12, food: 8 },
  pausedUntil: null,
  pauseMessage: null,
  prep: PREP,
};
const none = new Map<string, { drinks: number; food: number }>();
const starts = (windows: { start: Date }[]) =>
  windows.map((w) => w.start.toISOString());

describe("pickupWindows (ORD-03, ORD-04)", () => {
  it("offers 15-minute windows that start once the Order can be ready", () => {
    const windows = pickupWindows(at("09:03"), DAY, {
      prepMinutes: 10,
      need: { drinks: 2, food: 0 },
      used: none,
    });
    // Ready at 9:13, so the first window starts at 9:15.
    expect(starts(windows).slice(0, 2)).toEqual([
      "2026-11-02T01:15:00.000Z",
      "2026-11-02T01:30:00.000Z",
    ]);
  });

  it("ends with the window that closes at closing time", () => {
    const windows = pickupWindows(at("20:20"), DAY, {
      prepMinutes: 5,
      need: { drinks: 1, food: 0 },
      used: none,
    });
    expect(starts(windows)).toEqual([
      "2026-11-02T12:30:00.000Z",
      "2026-11-02T12:45:00.000Z",
    ]);
  });

  it("leaves out windows without room for this Order's drinks or food", () => {
    const used = new Map([
      ["2026-11-02T01:15:00.000Z", { drinks: 11, food: 0 }],
      ["2026-11-02T01:30:00.000Z", { drinks: 0, food: 8 }],
    ]);
    const windows = pickupWindows(at("09:03"), DAY, {
      prepMinutes: 10,
      need: { drinks: 2, food: 1 },
      used,
    });
    expect(starts(windows)[0]).toBe("2026-11-02T01:45:00.000Z");
    expect(windows[0]).toMatchObject({ drinksLeft: 12, foodLeft: 8 });
  });

  it("offers nothing on a closed day", () => {
    expect(
      pickupWindows(
        at("09:00"),
        { ...DAY, hours: null },
        {
          prepMinutes: 5,
          need: { drinks: 1, food: 0 },
          used: none,
        }
      )
    ).toEqual([]);
  });
});

describe("orderingState (ORD-07, ORD-13)", () => {
  it("takes Orders until Last Order and counts down to it", () => {
    expect(orderingState(at("20:00"), DAY)).toEqual({
      canOrder: true,
      lastOrderAt: at("20:30"),
      minutesToLastOrder: 30,
    });
  });

  it("refuses while Ordering Paused, with the Manager's message", () => {
    const paused = {
      ...DAY,
      pausedUntil: at("10:00"),
      pauseMessage: "The bar is swamped. Back at 10!",
    };
    expect(orderingState(at("09:00"), paused)).toEqual({
      canOrder: false,
      reason: "paused",
      until: at("10:00"),
      message: "The bar is swamped. Back at 10!",
    });
    expect(orderingState(at("10:00"), paused).canOrder).toBe(true);
  });

  it("refuses before opening, after Last Order and on a closed day", () => {
    expect(orderingState(at("06:30"), DAY)).toMatchObject({
      canOrder: false,
      reason: "before_opening",
    });
    expect(orderingState(at("20:30"), DAY)).toMatchObject({
      canOrder: false,
      reason: "after_last_order",
    });
    expect(orderingState(at("12:00"), { ...DAY, hours: null })).toMatchObject({
      canOrder: false,
      reason: "closed_today",
    });
  });
});
