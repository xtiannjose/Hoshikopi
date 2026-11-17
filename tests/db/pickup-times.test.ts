import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { nextPickupTimes } from "@/modules/ordering";

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

// Home's pickup card had no Pickup Time (audit UI2-05).
describe("nextPickupTimes", () => {
  it("gives the next five Pickup Times for one drink, soonest first", async () => {
    expect(await nextPickupTimes(MONDAY_9AM)).toEqual({
      kind: "open",
      times: ["09:15", "09:30", "09:45", "10:00", "10:15"].map((t) =>
        at("2026-11-02", t)
      ),
    });
  });

  it("says until when ordering is paused, and nothing before opening", async () => {
    expect(await nextPickupTimes(at("2026-11-02", "06:00"))).toEqual({
      kind: "closed",
    });
    const until = at("2026-11-02", "09:30");
    await db.cafeSettings.update({
      where: { id: 1 },
      data: { orderingPausedUntil: until },
    });
    expect(await nextPickupTimes(MONDAY_9AM)).toEqual({
      kind: "paused",
      until,
    });
  });
});
