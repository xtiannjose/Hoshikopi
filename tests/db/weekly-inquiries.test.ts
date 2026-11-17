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

import { createTestDb, resetToSeed } from "./helpers";

const db = createTestDb();
const christian = {
  id: "seed-manager",
  name: "Christian",
  role: "manager" as const,
};

beforeEach(async () => {
  await resetToSeed(db);
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
  // Postgres refuses a NUL, so a script sending one got a 500 (audit
  // SEC2-10); line breaks and tabs still go through.
  it("refuses a hidden character in the name or message", async () => {
    expect(
      await submitInquiry({
        ...inquiry,
        name: "Lia\u0000",
        message: "Hello\u0000world",
      })
    ).toEqual({
      ok: false,
      errors: {
        name: "This has a hidden character we can't save. Try typing it again.",
        message:
          "This has a hidden character we can't save. Try typing it again.",
      },
    });
    expect(await db.inquiry.count()).toBe(0);
    expect(
      (
        await submitInquiry({
          ...inquiry,
          message: "Line one\nLine two\tthanks",
        })
      ).ok
    ).toBe(true);
  });

  // The date was only checked against a pattern, so 2026-13-01 or
  // 9999-99-99 reached Postgres and gave a 500, and 2026-02-31 became 3
  // March (audit DC-10).
  it("refuses a date that is not on the calendar", async () => {
    for (const wantedOn of ["2026-13-01", "9999-99-99", "2026-02-31"]) {
      expect(await submitInquiry({ ...inquiry, wantedOn })).toEqual({
        ok: false,
        errors: { wantedOn: "Choose a date." },
      });
    }
    expect(await db.inquiry.count()).toBe(0);
    expect((await submitInquiry({ ...inquiry, wantedOn: "" })).ok).toBe(true);
  });

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

  // The 200 newest were taken first and sorted after, so a New Inquiry
  // older than them never reached the Manager (audit DATA-02).
  it("lists an old New Inquiry ahead of 200 newer answered ones", async () => {
    await db.inquiry.create({
      data: {
        kind: "private_event",
        name: "Old but new",
        email: "old@example.com",
        message: "Still waiting.",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    });
    await db.inquiry.createMany({
      data: Array.from({ length: 200 }, (_, i) => ({
        kind: "large_order" as const,
        name: `Answered ${i}`,
        email: `a${i}@example.com`,
        message: "Done.",
        status: "answered" as const,
        createdAt: new Date(Date.UTC(2026, 5, 1, 0, i)),
      })),
    });
    const list = await inquiriesForStaff();
    expect(list[0]).toMatchObject({ name: "Old but new", status: "new" });
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
