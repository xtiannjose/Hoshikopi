import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { balance, birthdayTreat, starHistory } from "@/modules/loyalty";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const HOSHI = "seed-member";
const NOVEMBER = 11;

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock("2026-11-02T01:00:00Z"); // 9:00 AM, Nov 2 in Manila
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

describe("Birthday Treat (LOY-04)", () => {
  it("adds 9 Stars, a free drink, once in the birthday month", async () => {
    expect(await birthdayTreat(HOSHI, NOVEMBER)).toBe("granted");
    expect(await birthdayTreat(HOSHI, NOVEMBER)).toBe("given");

    expect(await balance(HOSHI)).toBe(9);
    expect(await starHistory(HOSHI)).toMatchObject([
      { kind: "birthday", stars: 9, reason: "Birthday Treat 2026" },
    ]);
  });

  it("gives nothing outside the birthday month or without one", async () => {
    expect(await birthdayTreat(HOSHI, 12)).toBeNull();
    expect(await birthdayTreat(HOSHI, null)).toBeNull();
    expect(await balance(HOSHI)).toBe(0);
  });

  it("follows the Manila calendar at the month's edge", async () => {
    freezeClock("2026-10-31T16:30:00Z"); // 12:30 AM, Nov 1 in Manila
    expect(await birthdayTreat(HOSHI, NOVEMBER)).toBe("granted");
  });

  it("comes again the next year, not twice in one year", async () => {
    await birthdayTreat(HOSHI, NOVEMBER);
    // Moving the birth month later the same year changes nothing.
    freezeClock("2026-12-05T01:00:00Z");
    expect(await birthdayTreat(HOSHI, 12)).toBe("given");
    freezeClock("2027-11-02T01:00:00Z");
    expect(await birthdayTreat(HOSHI, NOVEMBER)).toBe("granted");
    expect(await balance(HOSHI)).toBe(18);
  });
});
