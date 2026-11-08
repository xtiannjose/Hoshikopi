import { afterEach, describe, expect, it } from "vitest";

import {
  formatDate,
  formatTime,
  freezeClock,
  greetingFor,
  manila,
  manilaInstant,
  now,
  unfreezeClock,
} from "./clock";

afterEach(unfreezeClock);

describe("now", () => {
  it("can be frozen in tests", () => {
    freezeClock("2026-11-02T01:30:00Z");
    expect(now().toISOString()).toBe("2026-11-02T01:30:00.000Z");
  });
  it("returns a fresh copy each time", () => {
    freezeClock("2026-11-02T01:30:00Z");
    now().setUTCFullYear(2000);
    expect(now().getUTCFullYear()).toBe(2026);
  });
});

describe("manila", () => {
  it("gives the Manila day, weekday and minute of an instant", () => {
    // 23:30 UTC on Sunday Nov 1 is 7:30 AM Monday Nov 2 in Manila.
    expect(manila(new Date("2026-11-01T23:30:00Z"))).toEqual({
      day: "2026-11-02",
      weekday: 1,
      minutes: 7 * 60 + 30,
    });
  });
});

describe("manilaInstant", () => {
  it("turns a Manila day and minute into UTC", () => {
    expect(manilaInstant("2026-11-02", 7 * 60).toISOString()).toBe(
      "2026-11-01T23:00:00.000Z"
    );
  });
});

describe("formatting", () => {
  it("shows Manila times as 9:15 AM", () => {
    expect(formatTime(new Date("2026-11-02T01:15:00Z"))).toBe("9:15 AM");
    expect(formatTime(new Date("2026-11-02T12:30:00Z"))).toBe("8:30 PM");
  });
  it("shows dates as Sat, Nov 7", () => {
    expect(formatDate(new Date("2026-11-07T03:00:00Z"))).toBe("Sat, Nov 7");
  });
});

describe("greetingFor", () => {
  it("says umaga from 6:00 AM to 11:59 AM Manila time", () => {
    expect(greetingFor(new Date("2026-11-06T22:00:00Z"))).toBe(
      "Magandang umaga"
    );
    expect(greetingFor(new Date("2026-11-07T03:59:00Z"))).toBe(
      "Magandang umaga"
    );
  });
  it("says hapon from 12:00 PM to 5:59 PM", () => {
    expect(greetingFor(new Date("2026-11-07T04:00:00Z"))).toBe(
      "Magandang hapon"
    );
    expect(greetingFor(new Date("2026-11-07T09:59:00Z"))).toBe(
      "Magandang hapon"
    );
  });
  it("says gabi from 6:00 PM to 5:59 AM, the Night palette's hours", () => {
    expect(greetingFor(new Date("2026-11-07T10:00:00Z"))).toBe(
      "Magandang gabi"
    );
    expect(greetingFor(new Date("2026-11-06T21:59:00Z"))).toBe(
      "Magandang gabi"
    );
  });
});
