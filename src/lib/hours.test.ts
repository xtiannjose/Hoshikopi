import { describe, expect, it } from "vitest";

import { afterLastOrder, hoursOn, openState, type Hours } from "./hours";

const everyDay = (weekday: number) => ({
  weekday,
  opensAt: "07:00",
  lastOrderAt: "20:30",
  closesAt: "21:00",
  isClosed: false,
});

const HOURS: Hours = {
  weekly: [0, 1, 2, 3, 4, 5, 6].map(everyDay),
  special: [
    {
      day: "2026-11-01",
      isClosed: false,
      opensAt: "10:00",
      lastOrderAt: "17:30",
      closesAt: "18:00",
      note: "All Saints' Day",
    },
    { day: "2026-12-25", isClosed: true, note: "Christmas" },
  ],
};

// Manila is UTC+8: 2026-11-02T01:00Z is 9:00 AM Monday Nov 2 in Manila.
const at = (manilaIso: string) => new Date(`${manilaIso}+08:00`);

describe("hoursOn", () => {
  it("uses the weekly hours", () => {
    expect(hoursOn("2026-11-02", HOURS)).toMatchObject({
      opensAt: "07:00",
      closesAt: "21:00",
    });
  });

  it("lets Special Hours override one day", () => {
    expect(hoursOn("2026-11-01", HOURS)).toMatchObject({
      opensAt: "10:00",
      note: "All Saints' Day",
    });
    expect(hoursOn("2026-12-25", HOURS)).toBeNull();
  });
});

describe("openState", () => {
  it("is open between opening and closing", () => {
    expect(openState(at("2026-11-02T09:00"), HOURS)).toEqual({
      open: true,
      closesAt: "21:00",
      lastOrderAt: "20:30",
      minutesToLastOrder: 690,
    });
  });

  it("is closed before opening, and says when it opens today", () => {
    expect(openState(at("2026-11-02T06:30"), HOURS)).toEqual({
      open: false,
      opensAt: "07:00",
      opensDay: "2026-11-02",
    });
  });

  it("after closing, points to the next open day past a closed one", () => {
    expect(openState(at("2026-12-24T22:00"), HOURS)).toEqual({
      open: false,
      opensAt: "07:00",
      opensDay: "2026-12-26",
    });
  });
});

// Between Last Order and closing the cafe is open for walk-ins, and the
// Customer is told when ordering opens again (ORD-13, audit journeys:16).
describe("afterLastOrder", () => {
  it("says when to walk in and when ordering opens again", () => {
    expect(afterLastOrder(at("2026-11-02T20:40"), HOURS)).toBe(
      "Last orders were at 8:30 PM. Walk in until 9:00 PM, or order ahead from 7:00 AM tomorrow."
    );
  });

  it("names the day when tomorrow is closed", () => {
    expect(afterLastOrder(at("2026-12-24T20:40"), HOURS)).toBe(
      "Last orders were at 8:30 PM. Walk in until 9:00 PM, or order ahead from 7:00 AM on Sat, Dec 26."
    );
  });

  it("is nothing before Last Order or after closing", () => {
    expect(afterLastOrder(at("2026-11-02T20:00"), HOURS)).toBeNull();
    expect(afterLastOrder(at("2026-11-02T21:10"), HOURS)).toBeNull();
  });
});
