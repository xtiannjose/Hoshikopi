import { afterEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";

import { eventCalendar } from "./calendar";

afterEach(unfreezeClock);

const event = {
  slug: "latte-art-night",
  title: "Latte Art Night; hearts, tulips, rosettas",
  summary: "Pour your first rosetta with Annika.",
  startsAt: new Date("2026-11-12T11:00:00Z"), // 7:00 PM in Manila
  endsAt: new Date("2026-11-12T13:00:00Z"),
};

describe("eventCalendar (EVT-04)", () => {
  it("writes one VEVENT in UTC with CRLF line ends", () => {
    freezeClock("2026-11-02T01:00:00Z");
    const ics = eventCalendar(event, "https://hoshikopi.vercel.app");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.split("\r\n")).toEqual(
      expect.arrayContaining([
        "BEGIN:VEVENT",
        "UID:latte-art-night@hoshikopi",
        "DTSTAMP:20261102T010000Z",
        "DTSTART:20261112T110000Z",
        "DTEND:20261112T130000Z",
        "SUMMARY:Latte Art Night\\; hearts\\, tulips\\, rosettas",
        "URL:https://hoshikopi.vercel.app/events/latte-art-night",
      ])
    );
  });

  it("folds lines longer than 75 characters", () => {
    const long = eventCalendar(
      { ...event, summary: "x".repeat(200) },
      "https://hoshikopi.vercel.app"
    );
    for (const line of long.split("\r\n")) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
    expect(long).toContain("\r\n x");
  });
});
