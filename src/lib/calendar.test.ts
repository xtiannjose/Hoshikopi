import { afterEach, describe, expect, it } from "vitest";

import { calendarFile } from "./calendar";
import { freezeClock, unfreezeClock } from "./clock";

afterEach(unfreezeClock);

const entry = {
  uid: "order-1@hoshikopi",
  startsAt: new Date("2026-11-12T07:00:00Z"), // 3:00 PM in Manila
  endsAt: new Date("2026-11-12T07:15:00Z"),
  summary: "Pick up K-012",
  description: "2 x Hoshi Latte",
  location: "Hoshikopi, Kapitolyo, Pasig",
  url: "https://hoshikopi.vercel.app/orders/1?t=abc",
};

describe("calendarFile", () => {
  it("writes one VEVENT in UTC with CRLF line ends", () => {
    freezeClock("2026-11-02T01:00:00Z");
    const ics = calendarFile(entry);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.split("\r\n")).toEqual(
      expect.arrayContaining([
        "UID:order-1@hoshikopi",
        "DTSTAMP:20261102T010000Z",
        "DTSTART:20261112T070000Z",
        "DTEND:20261112T071500Z",
        "SUMMARY:Pick up K-012",
        "LOCATION:Hoshikopi\\, Kapitolyo\\, Pasig",
      ])
    );
  });

  it("escapes every line break, a lone CR included, and drops other control characters", () => {
    const ics = calendarFile({
      ...entry,
      summary: "Latte\rArt\r\nNight\n\u0007\u0000!",
    });
    expect(ics).toContain("SUMMARY:Latte\\nArt\\nNight\\n!\r\n");
  });

  it("folds at 75 bytes without splitting a character", () => {
    const ics = calendarFile({ ...entry, description: "☕🌙".repeat(40) });
    const encoder = new TextEncoder();
    const lines = ics.split("\r\n");
    for (const line of lines) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain(`DESCRIPTION:${"☕🌙".repeat(40)}`);
  });
});
