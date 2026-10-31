import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import {
  contentForStaff,
  readEvents,
  readPosts,
  saveEvent,
  savePost,
} from "@/modules/content";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const hoshi = { id: "seed-manager", name: "Hoshi", role: "manager" as const };

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  freezeClock(new Date());
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

describe("Events (EVT-01)", () => {
  it("lists upcoming published Events soonest first and keeps past ones apart", async () => {
    await db.event.create({
      data: {
        slug: "old-cupping",
        title: "Cupping",
        startsAt: new Date(Date.now() - 3 * 86_400_000),
        endsAt: new Date(Date.now() - 3 * 86_400_000 + 3_600_000),
        summary: "Done",
        bodyMd: "Done",
        isPublished: true,
      },
    });
    await db.event.create({
      data: {
        slug: "draft",
        title: "Draft",
        startsAt: new Date(Date.now() + 86_400_000),
        endsAt: new Date(Date.now() + 90_000_000),
        summary: "Draft",
        bodyMd: "Draft",
        isPublished: false,
      },
    });
    const { upcoming, past } = await readEvents();
    expect(upcoming.map((e) => e.slug)).toEqual([
      "latte-art-night",
      "open-mic-under-the-stars",
    ]);
    expect(past.map((e) => e.slug)).toEqual(["old-cupping"]);
  });

  it("saves an Event in Manila time and refuses an end before the start", async () => {
    const input = {
      title: "Home brewing basics",
      slug: "home-brewing-basics",
      startsAt: "2026-11-12T19:00",
      endsAt: "2026-11-12T21:00",
      summary: "Pour-over at home, step by step.",
      bodyMd: "Bring a mug.",
      price: "250",
      signupUrl: "",
      isPublished: "on",
    };
    expect(await saveEvent(null, input, hoshi)).toMatchObject({ ok: true });
    const event = await db.event.findUniqueOrThrow({
      where: { slug: "home-brewing-basics" },
    });
    expect(event.startsAt.toISOString()).toBe("2026-11-12T11:00:00.000Z");
    expect(event.priceCents).toBe(25000);
    expect(
      await saveEvent(
        null,
        { ...input, slug: "x", endsAt: "2026-11-12T18:00" },
        hoshi
      )
    ).toMatchObject({ ok: false, errors: { endsAt: expect.any(String) } });
  });
});

describe("Posts (NEWS-01)", () => {
  it("shows only published Posts, newest first, and publishing sets the date", async () => {
    expect((await readPosts()).map((p) => p.slug)).toEqual([
      "how-we-make-the-hoshi-latte",
      "our-beans-from-benguet",
      "order-ahead-skip-the-line",
    ]);
    const result = await savePost(
      null,
      {
        title: "Ube season",
        slug: "ube-season",
        excerpt: "The ube latte is back.",
        bodyMd: "Purple!",
        isPublished: undefined,
      },
      hoshi
    );
    expect(result.ok).toBe(true);
    expect((await readPosts()).map((p) => p.slug)).not.toContain("ube-season");
    const staff = await contentForStaff();
    expect(
      staff.posts.find((p) => p.slug === "ube-season")?.publishedAt
    ).toBeNull();
  });
});
