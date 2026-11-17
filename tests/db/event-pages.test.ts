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
import { getEvent } from "@/modules/content";

import { createTestDb, resetToSeed } from "./helpers";

// getEvent is cached; outside Next there is no cache to tag.
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  cacheTag: () => {},
  cacheLife: () => {},
}));

const db = createTestDb();
const NOW = new Date("2026-11-17T04:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

beforeEach(async () => {
  await resetToSeed(db);
  freezeClock(NOW);
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

const event = (slug: string, endedDaysAgo: number, isPublished = true) =>
  db.event.create({
    data: {
      slug,
      title: slug,
      startsAt: daysAgo(endedDaysAgo),
      endsAt: new Date(daysAgo(endedDaysAgo).getTime() + 3_600_000),
      summary: "Done",
      bodyMd: "Done",
      isPublished,
    },
  });

// getEvent picked from the cached lists, whose past list keeps only the
// latest 12, so an older Event's page, share picture and calendar file
// went to "not found" (audit DC-24).
describe("getEvent", () => {
  it("finds a published Event however many have ended since, and says it ended", async () => {
    await event("supper-club", 60);
    for (let n = 1; n <= 13; n++) await event(`newer-${n}`, n);
    expect(await getEvent("supper-club")).toMatchObject({
      slug: "supper-club",
      ended: true,
    });
  });

  it("says an upcoming Event has not ended, and finds no unpublished one", async () => {
    await event("draft", 1, false);
    expect(await getEvent("draft")).toBeNull();
    const upcoming = await db.event.findFirstOrThrow({
      where: { isPublished: true, endsAt: { gt: NOW } },
    });
    expect(await getEvent(upcoming.slug)).toMatchObject({ ended: false });
  });
});
