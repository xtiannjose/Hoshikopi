import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import {
  inquiriesForStaff,
  readRecurringEvents,
  recurringForStaff,
  saveRecurringEvent,
  setInquiryStatus,
  submitInquiry,
} from "@/modules/content";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const christian = {
  id: "seed-manager",
  name: "Christian",
  role: "manager" as const,
};

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock("2026-11-02T01:00:00Z"); // Monday, Nov 2 in Manila
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

const weekly = {
  title: "Board games",
  weekday: "1",
  startsAt: "18:00",
  endsAt: "20:00",
  note: "",
  isPublished: "on",
};

describe("Recurring Events (EVT-03)", () => {
  it("lists published ones Monday first", async () => {
    await saveRecurringEvent(null, weekly, christian);
    expect((await readRecurringEvents()).map((e) => e.title)).toEqual([
      "Board games",
      "Latte art practice",
      "Open mic",
      "Saturday cupping",
    ]);
  });

  it("keeps hidden ones for Staff only", async () => {
    await saveRecurringEvent(
      null,
      { ...weekly, isPublished: undefined },
      christian
    );
    expect((await readRecurringEvents()).map((e) => e.title)).not.toContain(
      "Board games"
    );
    expect((await recurringForStaff()).map((e) => e.title)).toContain(
      "Board games"
    );
  });

  it("refuses an end before the start", async () => {
    expect(
      await saveRecurringEvent(null, { ...weekly, endsAt: "17:00" }, christian)
    ).toEqual({
      ok: false,
      errors: { endsAt: "The end must be after the start." },
    });
  });
});

const inquiry = {
  kind: "private_event" as const,
  name: "Hoshi",
  email: "Hoshi@Example.com",
  wantedOn: "2026-11-20",
  guests: "24",
  message: "A small birthday party on a Friday night.",
};

describe("Inquiries (INFO-11)", () => {
  it("saves one for the Manager", async () => {
    const result = await submitInquiry(inquiry);
    expect(result).toMatchObject({
      ok: true,
      inquiry: {
        email: "hoshi@example.com",
        wantedOn: "2026-11-20",
        guests: 24,
        status: "new",
      },
    });
  });

  it("refuses a past date, a bad email, zero guests and no message", async () => {
    expect(await submitInquiry({ ...inquiry, wantedOn: "2026-11-01" })).toEqual(
      { ok: false, errors: { wantedOn: "Choose today or a later date." } }
    );
    const result = await submitInquiry({
      ...inquiry,
      email: "hoshi",
      guests: "0",
      message: " ",
    });
    expect(result.ok).toBe(false);
    expect(Object.keys(!result.ok ? result.errors : {})).toEqual([
      "email",
      "guests",
      "message",
    ]);
  });

  it("lists new ones first after the Manager answers one", async () => {
    const first = await submitInquiry(inquiry);
    await submitInquiry({ ...inquiry, name: "Annika", kind: "large_order" });
    if (!first.ok) throw new Error("not saved");
    await setInquiryStatus(first.inquiry.id, "answered", christian);
    expect((await inquiriesForStaff()).map((i) => [i.name, i.status])).toEqual([
      ["Annika", "new"],
      ["Hoshi", "answered"],
    ]);
  });
});
