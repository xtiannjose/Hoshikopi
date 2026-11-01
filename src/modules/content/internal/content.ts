import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { manilaInstant, now } from "@/lib/clock";
import { db } from "@/lib/db";
import { parsePesos } from "@/lib/money";
import { audit, type Staff } from "@/modules/identity";

export type EventCard = {
  slug: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  summary: string;
  bodyMd: string;
  photoUrl: string | null;
  photoAlt: string | null;
  priceCents: number | null;
  signupUrl: string | null;
  /** Seats for Sign-ups here and how many are left; null takes none (EVT-02). */
  seats: number | null;
  seatsLeft: number | null;
};

export type PostCard = {
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
  coverUrl: string | null;
  coverAlt: string | null;
  publishedAt: Date;
};

const eventSelect = {
  slug: true,
  title: true,
  startsAt: true,
  endsAt: true,
  summary: true,
  bodyMd: true,
  photoUrl: true,
  photoAlt: true,
  priceCents: true,
  signupUrl: true,
  seats: true,
  signups: { select: { seats: true } },
} as const;

type EventRow = Omit<EventCard, "seatsLeft"> & { signups: { seats: number }[] };

function toEventCard({ signups, ...event }: EventRow): EventCard {
  const taken = signups.reduce((sum, signup) => sum + signup.seats, 0);
  return {
    ...event,
    seatsLeft: event.seats === null ? null : Math.max(event.seats - taken, 0),
  };
}

/** Published Events: upcoming soonest first, past latest first (EVT-01). */
export async function readEvents(): Promise<{
  upcoming: EventCard[];
  past: EventCard[];
}> {
  const at = now();
  const [upcoming, past] = await Promise.all([
    db.event.findMany({
      where: { isPublished: true, endsAt: { gte: at } },
      orderBy: { startsAt: "asc" },
      select: eventSelect,
    }),
    db.event.findMany({
      where: { isPublished: true, endsAt: { lt: at } },
      orderBy: { startsAt: "desc" },
      take: 12,
      select: eventSelect,
    }),
  ]);
  return { upcoming: upcoming.map(toEventCard), past: past.map(toEventCard) };
}

/** Published Posts, newest first (NEWS-01). */
export async function readPosts(): Promise<PostCard[]> {
  const posts = await db.post.findMany({
    where: { publishedAt: { not: null, lte: now() } },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      bodyMd: true,
      coverUrl: true,
      coverAlt: true,
      publishedAt: true,
    },
  });
  return posts.map((post) => ({ ...post, publishedAt: post.publishedAt! }));
}

// Cached for public pages under the "content" tag; Staff saves update it,
// and the one-minute lifetime moves Events from upcoming to past.
export async function getEvents() {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  return readEvents();
}

export async function getPosts() {
  "use cache";
  cacheTag("content");
  cacheLife("minutes");
  return readPosts();
}

export async function getEvent(slug: string): Promise<EventCard | null> {
  const { upcoming, past } = await getEvents();
  return [...upcoming, ...past].find((e) => e.slug === slug) ?? null;
}

export async function getPost(slug: string): Promise<PostCard | null> {
  return (await getPosts()).find((p) => p.slug === slug) ?? null;
}

// ---------- Staff (STAFF-06) ----------

/** Everything the Manager edits, drafts included, read fresh. */
export async function contentForStaff() {
  const [events, posts] = await Promise.all([
    db.event.findMany({ orderBy: { startsAt: "desc" } }),
    db.post.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return { events, posts };
}

export type ContentResult =
  | { ok: true; id: string }
  | { ok: false; errors: Partial<Record<string, string>> };

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and dashes."
  )
  .max(80);
const checkbox = z.preprocess((v) => v === "on" || v === true, z.boolean());
// "2026-11-12T19:00" from a datetime-local input, in Manila time.
const manilaTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a date and time.")
  .transform((v) =>
    manilaInstant(
      v.slice(0, 10),
      Number(v.slice(11, 13)) * 60 + Number(v.slice(14, 16))
    )
  );

const EventInput = z
  .object({
    title: z.string().trim().min(1, "Enter a title.").max(80),
    slug,
    startsAt: manilaTime,
    endsAt: manilaTime,
    summary: z.string().trim().min(1, "Write one line.").max(200),
    bodyMd: z.string().trim().min(1, "Write something.").max(6000),
    price: z.string().trim(),
    signupUrl: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || /^https:\/\//.test(v),
        "Use an https:// link."
      ),
    seats: z
      .string()
      .trim()
      .optional()
      .refine(
        (v) => !v || (/^\d+$/.test(v) && +v >= 1 && +v <= 500),
        "Enter 1 to 500 seats, or leave it empty for no sign-up here."
      ),
    isPublished: checkbox,
  })
  .refine((e) => e.endsAt > e.startsAt, {
    path: ["endsAt"],
    message: "The end must be after the start.",
  })
  .refine((e) => e.price === "" || parsePesos(e.price) !== null, {
    path: ["price"],
    message: "Enter pesos, like 250, or leave it empty for free.",
  });

const PostInput = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(100),
  slug,
  excerpt: z.string().trim().min(1, "Write one line.").max(180),
  bodyMd: z.string().trim().min(1, "Write something.").max(12000),
  isPublished: checkbox,
});

function errorsOf(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues)
    errors[String(issue.path[0])] ??= issue.message;
  return errors;
}

const clash = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

export async function saveEvent(
  id: string | null,
  input: z.input<typeof EventInput>,
  actor: Staff
): Promise<ContentResult> {
  const parsed = EventInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: errorsOf(parsed.error) };
  const { price, signupUrl, seats, ...rest } = parsed.data;
  const data = {
    ...rest,
    priceCents: price === "" ? null : parsePesos(price),
    signupUrl: signupUrl || null,
    // Absent leaves it as it is; empty takes no Sign-ups here.
    seats: seats === undefined ? undefined : Number(seats) || null,
  };
  try {
    const event = await db.$transaction(async (tx) => {
      const saved = id
        ? await tx.event.update({ where: { id }, data })
        : await tx.event.create({ data });
      await audit(
        actor,
        id ? "content.event.update" : "content.event.create",
        { type: "event", id: saved.id },
        {},
        tx
      );
      return saved;
    });
    return { ok: true, id: event.id };
  } catch (error) {
    if (clash(error))
      return { ok: false, errors: { slug: "Another Event uses this." } };
    throw error;
  }
}

export async function savePost(
  id: string | null,
  input: z.input<typeof PostInput>,
  actor: Staff
): Promise<ContentResult> {
  const parsed = PostInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: errorsOf(parsed.error) };
  const { isPublished, ...rest } = parsed.data;
  try {
    const post = await db.$transaction(async (tx) => {
      const current = id ? await tx.post.findUnique({ where: { id } }) : null;
      const data = {
        ...rest,
        // Publishing stamps the date once; unpublishing makes it a draft.
        publishedAt: isPublished ? (current?.publishedAt ?? now()) : null,
        authorId: current?.authorId ?? actor.id,
      };
      const saved = id
        ? await tx.post.update({ where: { id }, data })
        : await tx.post.create({ data });
      await audit(
        actor,
        id ? "content.post.update" : "content.post.create",
        { type: "post", id: saved.id },
        {},
        tx
      );
      return saved;
    });
    return { ok: true, id: post.id };
  } catch (error) {
    if (clash(error))
      return { ok: false, errors: { slug: "Another Post uses this." } };
    throw error;
  }
}
