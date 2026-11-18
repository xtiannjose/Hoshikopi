import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import {
  deleteSpecialHoursAction,
  saveWeeklyHoursAction,
} from "@/app/manage/hours/actions";
import { getHoursForStaff, saveSpecialHours } from "@/modules/cafe";

import { createTestDb, resetToSeed } from "./helpers";

const christian = {
  id: "seed-manager",
  name: "Christian",
  role: "manager",
} as const;

vi.mock("@/modules/identity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/identity")>()),
  requireStaff: async () => christian,
}));
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  updateTag: () => {},
  revalidatePath: () => {},
  refresh: () => {},
}));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
}));

const db = createTestDb();
// Monday 2 November 2026, 10 AM in Manila.
const at = (hhmm: string) => new Date(`2026-11-02T${hhmm}:00+08:00`);

beforeEach(async () => {
  await resetToSeed(db);
  freezeClock(at("10:00"));
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

/** A Pay at Pickup Order booked for `window` today. */
async function bookedFor(window: string) {
  await db.order.create({
    data: {
      serviceDay: new Date("2026-11-02"),
      code: `K-${window.replace(":", "")}`,
      status: "placed",
      customerName: "Hoshi",
      customerEmail: "hoshi@example.com",
      pickupKind: "scheduled",
      windowStart: at(window),
      paymentMethod: "pay_at_pickup",
      totalCents: 18500,
      accessTokenHash: "x",
      placedAt: at("09:00"),
    },
  });
}

/** The Opening Hours form as the page sends it, Monday changed. */
async function weeklyForm(monday: { last: string; closes: string }) {
  const { weekly } = await getHoursForStaff(at("10:00"));
  const form = new FormData();
  for (const day of weekly) {
    const isMonday = day.weekday === 1;
    if (day.isClosed) form.set(`closed-${day.weekday}`, "on");
    form.set(`opens-${day.weekday}`, day.opensAt ?? "");
    form.set(
      `last-${day.weekday}`,
      isMonday ? monday.last : (day.lastOrderAt ?? "")
    );
    form.set(
      `closes-${day.weekday}`,
      isMonday ? monday.closes : (day.closesAt ?? "")
    );
  }
  return form;
}

// Only saving Special Hours warned about Orders left after a new, earlier
// closing; changing today's Opening Hours or removing today's Special Hours
// said just "Saved." (audit DC-14).
describe("Orders booked after today's new closing", () => {
  it("are counted when today's Opening Hours close earlier", async () => {
    await bookedFor("20:30");
    const result = await saveWeeklyHoursAction(
      { status: "idle" },
      await weeklyForm({ last: "19:30", closes: "20:00" })
    );
    expect(result).toEqual({
      status: "saved",
      saved:
        "Saved. 1 Order today is booked after the new closing. Cancel it with a reason on the Orders page.",
    });
  });

  it("are not mentioned when nothing is stranded", async () => {
    await bookedFor("19:00");
    expect(
      await saveWeeklyHoursAction(
        { status: "idle" },
        await weeklyForm({ last: "19:30", closes: "20:00" })
      )
    ).toEqual({ status: "saved" });
  });

  it("are counted when today's later Special Hours are removed", async () => {
    await saveSpecialHours(
      {
        day: "2026-11-02",
        isClosed: false,
        opensAt: "07:00",
        lastOrderAt: "23:00",
        closesAt: "23:30",
        note: "Late night",
      },
      christian
    );
    await bookedFor("22:30");
    const form = new FormData();
    form.set("day", "2026-11-02");
    await expect(deleteSpecialHoursAction(form)).rejects.toThrow(
      "redirect /manage/hours?booked=1"
    );
  });
});
