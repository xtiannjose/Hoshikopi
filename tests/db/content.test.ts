import { del, put } from "@vercel/blob";
import sharp from "sharp";
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
  contentForStaff,
  readEvents,
  readPosts,
  saveEvent,
  deletePost,
  savePost,
} from "@/modules/content";

import { createTestDb, resetToSeed } from "./helpers";

vi.mock("@vercel/blob", () => ({ put: vi.fn(), del: vi.fn() }));

const db = createTestDb();
const christian = {
  id: "seed-manager",
  name: "Christian",
  role: "manager" as const,
};

beforeEach(async () => {
  await resetToSeed(db);
  freezeClock(new Date());
});
afterEach(() => {
  unfreezeClock();
  vi.unstubAllEnvs();
  vi.mocked(put).mockReset();
  vi.mocked(del).mockReset();
});
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

  // A price past the column's range gave a 500 (audit staff:6).
  it("refuses an Event price over PHP 100,000", async () => {
    const result = await saveEvent(
      null,
      {
        title: "Big night",
        slug: "big-night",
        startsAt: "2026-11-12T19:00",
        endsAt: "2026-11-12T21:00",
        summary: "One line.",
        bodyMd: "Body.",
        price: "250000",
        signupUrl: "",
        isPublished: "on",
      },
      christian
    );
    expect(result).toMatchObject({
      ok: false,
      errors: { price: "Use PHP 100,000 or less, or leave it empty for free." },
    });
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
    expect(await saveEvent(null, input, christian)).toMatchObject({ ok: true });
    const event = await db.event.findUniqueOrThrow({
      where: { slug: "home-brewing-basics" },
    });
    expect(event.startsAt.toISOString()).toBe("2026-11-12T11:00:00.000Z");
    expect(event.priceCents).toBe(25000);
    expect(
      await saveEvent(
        null,
        { ...input, slug: "x", endsAt: "2026-11-12T18:00" },
        christian
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
      christian
    );
    expect(result.ok).toBe(true);
    expect((await readPosts()).map((p) => p.slug)).not.toContain("ube-season");
    const staff = await contentForStaff();
    expect(
      staff.posts.find((p) => p.slug === "ube-season")?.publishedAt
    ).toBeNull();
  });

  // Test and abandoned drafts stayed in the Staff list for good (audit
  // staff:9).
  it("deletes a draft Post, never a published one", async () => {
    const published = await db.post.findUniqueOrThrow({
      where: { slug: "our-beans-from-benguet" },
    });
    expect(await deletePost(published.id, christian)).toBe(false);
    expect(await db.post.count({ where: { id: published.id } })).toBe(1);

    const draft = await savePost(
      null,
      {
        title: "Test draft",
        slug: "test-draft",
        excerpt: "Nothing yet.",
        bodyMd: "Draft.",
        isPublished: undefined,
      },
      christian
    );
    if (!draft.ok) throw new Error("not saved");
    expect(await deletePost(draft.id, christian)).toBe(true);
    expect(await db.post.count({ where: { id: draft.id } })).toBe(0);
    expect(
      await db.auditLog.count({
        where: { action: "content.post.delete", targetId: draft.id },
      })
    ).toBe(1);
  });
});

// Managers could add a photo to a Menu Item, but not to an Event or Post
// (12.3).
describe("Event and Post photos (12.3)", () => {
  const BLOB = "https://store.public.blob.vercel-storage.com/";
  const png = async () =>
    new File(
      [
        await sharp({
          create: { width: 4, height: 3, channels: 3, background: "#e7a83f" },
        })
          .png()
          .toBuffer(),
      ],
      "photo.png"
    );
  const useBlob = () => {
    vi.stubEnv("BLOB_STORE_ID", "store_test");
    vi.mocked(put).mockImplementation(
      async (pathname) =>
        ({ url: `${BLOB}${pathname}` }) as Awaited<ReturnType<typeof put>>
    );
  };

  it("stores an Event photo once the save passes, and deletes the one it replaces", async () => {
    useBlob();
    const event = await db.event.findUniqueOrThrow({
      where: { slug: "latte-art-night" },
    });
    const input = {
      title: event.title,
      slug: event.slug,
      startsAt: "2026-12-04T19:00",
      endsAt: "2026-12-04T21:00",
      summary: event.summary,
      bodyMd: event.bodyMd,
      price: "",
      signupUrl: "",
      photoAlt: "Rosetta latte art in a blue cup",
      isPublished: "on",
    };
    const notAPhoto = new File(["GIF89a"], "x.png");
    expect(await saveEvent(event.id, input, christian, notAPhoto)).toEqual({
      ok: false,
      errors: { photo: "Choose a JPEG, PNG or WebP photo." },
    });
    expect(
      await saveEvent(
        event.id,
        { ...input, endsAt: "" },
        christian,
        await png()
      )
    ).toMatchObject({ ok: false });
    expect(put).not.toHaveBeenCalled();

    const old = `${BLOB}events/old.png`;
    await db.event.update({ where: { id: event.id }, data: { photoUrl: old } });
    expect(await saveEvent(event.id, input, christian, await png())).toEqual({
      ok: true,
      id: event.id,
    });
    const saved = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(saved.photoUrl).toMatch(/\/events\/latte-art-night-\d+\.png$/);
    expect(saved.photoAlt).toBe("Rosetta latte art in a blue cup");
    expect(del).toHaveBeenCalledWith(old);
  });

  it("gives a Post a cover photo, and deleting the draft deletes its cover", async () => {
    useBlob();
    const draft = await savePost(
      null,
      {
        title: "Ube season",
        slug: "ube-season",
        excerpt: "The ube latte is back.",
        bodyMd: "Purple!",
        coverAlt: "",
        isPublished: undefined,
      },
      christian,
      await png()
    );
    if (!draft.ok) throw new Error("not saved");
    const post = await db.post.findUniqueOrThrow({ where: { id: draft.id } });
    expect(post.coverUrl).toMatch(/\/posts\/ube-season-\d+\.png$/);
    expect(post.coverAlt).toBeNull();
    expect(await deletePost(draft.id, christian)).toBe(true);
    expect(del).toHaveBeenCalledWith(post.coverUrl);
  });

  // A photo could be replaced but never removed (audit CK-04).
  it("removes an Event's photo when Remove this photo is ticked", async () => {
    useBlob();
    const event = await db.event.findUniqueOrThrow({
      where: { slug: "latte-art-night" },
    });
    const old = `${BLOB}events/old.png`;
    await db.event.update({
      where: { id: event.id },
      data: { photoUrl: old, photoAlt: "Old photo" },
    });
    const input = {
      title: event.title,
      slug: event.slug,
      startsAt: "2026-12-04T19:00",
      endsAt: "2026-12-04T21:00",
      summary: event.summary,
      bodyMd: event.bodyMd,
      price: "",
      signupUrl: "",
      photoAlt: "Old photo",
      removePhoto: "on",
      isPublished: "on",
    };
    expect(await saveEvent(event.id, input, christian)).toEqual({
      ok: true,
      id: event.id,
    });
    const saved = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect([saved.photoUrl, saved.photoAlt]).toEqual([null, null]);
    expect(del).toHaveBeenCalledWith(old);
  });

  it("removes a Post's cover, and a new file wins over the tick", async () => {
    useBlob();
    const post = await db.post.findUniqueOrThrow({
      where: { slug: "our-beans-from-benguet" },
    });
    const input = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      bodyMd: post.bodyMd,
      removePhoto: "on",
      isPublished: "on",
    };
    expect((await savePost(post.id, input, christian, await png())).ok).toBe(
      true
    );
    const replaced = await db.post.findUniqueOrThrow({
      where: { id: post.id },
    });
    expect(replaced.coverUrl).toMatch(
      /\/posts\/our-beans-from-benguet-\d+\.png$/
    );

    expect((await savePost(post.id, input, christian)).ok).toBe(true);
    expect(
      (await db.post.findUniqueOrThrow({ where: { id: post.id } })).coverUrl
    ).toBeNull();
    expect(del).toHaveBeenCalledWith(replaced.coverUrl);
  });

  it("keeps the save and says so when the photo store fails", async () => {
    vi.stubEnv("BLOB_STORE_ID", "store_test");
    vi.mocked(put).mockRejectedValue(new Error("Access denied"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const post = await db.post.findUniqueOrThrow({
      where: { slug: "our-beans-from-benguet" },
    });
    const result = await savePost(
      post.id,
      {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        bodyMd: post.bodyMd,
        isPublished: "on",
      },
      christian,
      await png()
    );
    expect(result).toEqual({
      ok: true,
      id: post.id,
      photoError: "We couldn't save the photo. Try again in a moment.",
    });
    expect(
      (await db.post.findUniqueOrThrow({ where: { id: post.id } })).coverUrl
    ).toBe(post.coverUrl);
  });
});
