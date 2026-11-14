import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { now } from "@/lib/clock";
import { db } from "@/lib/db";

/** How long a Sign-up holds its Seats before its email link confirms it. */
export const HOLD_MINUTES = 30;

const holdStart = (at: Date) => new Date(at.getTime() - HOLD_MINUTES * 60_000);

/** Sign-ups that hold Seats at `at`: confirmed, or waiting under 30 minutes. */
export function heldSignups(at: Date) {
  return {
    OR: [{ confirmedAt: { not: null } }, { createdAt: { gt: holdStart(at) } }],
  } satisfies Prisma.EventSignupWhereInput;
}

function secret(): string {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is not set");
  return value;
}

/** The link token for a Sign-up, derived from its id and never stored. */
export function signupToken(id: string): string {
  return createHmac("sha256", secret())
    .update(`event-signup:${id}`)
    .digest("base64url");
}

function tokenMatches(id: string, token: string): boolean {
  const expected = Buffer.from(signupToken(id));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

const SignupInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(80, "Use 80 characters or fewer."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Enter an email address, like hoshi@example.com.")
    // z.email, as checkout: the old regex let "x@y.z?cc=a%40b.c" through
    // into the Manager's mailto links (audit SEC2-01).
    .pipe(z.email("Enter an email address, like hoshi@example.com.")),
  seats: z
    .string()
    .trim()
    .regex(/^[1-4]$/, "Choose 1 to 4 seats."),
});

export type SignupInput = z.input<typeof SignupInput>;

export type SignupResult =
  | {
      ok: true;
      seatsLeft: number;
      event: {
        title: string;
        slug: string;
        startsAt: Date;
        priceCents: number | null;
      };
      signup: { id: string; name: string; email: string; seats: number };
      /** For the email link that confirms or cancels it. */
      token: string;
    }
  | { ok: false; reason: "invalid"; errors: Partial<Record<string, string>> }
  | { ok: false; reason: "closed" | "already" }
  | { ok: false; reason: "full" | "too_many_seats"; seatsLeft: number };

type LockedEvent = {
  id: string;
  title: string;
  slug: string;
  startsAt: Date;
  priceCents: number | null;
  seats: number | null;
  isPublished: boolean;
};

/**
 * A Sign-up for an Event with Seats (EVT-02), until it starts. The Event's
 * row is locked while Seats are counted, so two at once never oversell. It
 * waits for its email link and holds the Seats for 30 minutes (8.7).
 */
export async function signUpForEvent(
  slug: string,
  input: SignupInput
): Promise<SignupResult> {
  const parsed = SignupInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, reason: "invalid", errors };
  }
  const { name, email } = parsed.data;
  const seats = Number(parsed.data.seats);
  const at = now();
  try {
    return await db.$transaction(async (tx): Promise<SignupResult> => {
      const [event] = await tx.$queryRaw<LockedEvent[]>`
        SELECT id, title, slug, starts_at AS "startsAt",
               price_cents AS "priceCents", seats, is_published AS "isPublished"
        FROM events WHERE slug = ${slug} FOR UPDATE`;
      if (!event?.isPublished || event.seats === null || event.startsAt <= at) {
        return { ok: false, reason: "closed" };
      }
      const taken = await tx.eventSignup.aggregate({
        where: { eventId: event.id, ...heldSignups(at) },
        _sum: { seats: true },
      });
      const left = event.seats - (taken._sum.seats ?? 0);
      if (left <= 0) return { ok: false, reason: "full", seatsLeft: 0 };
      if (seats > left) {
        return { ok: false, reason: "too_many_seats", seatsLeft: left };
      }
      // A wait by the same email that ran out makes way for this one.
      await tx.eventSignup.deleteMany({
        where: {
          eventId: event.id,
          email,
          confirmedAt: null,
          createdAt: { lte: holdStart(at) },
        },
      });
      const signup = await tx.eventSignup.create({
        data: { eventId: event.id, name, email, seats, createdAt: at },
        select: { id: true },
      });
      return {
        ok: true,
        seatsLeft: left - seats,
        event: {
          title: event.title,
          slug: event.slug,
          startsAt: event.startsAt,
          priceCents: event.priceCents,
        },
        signup: { id: signup.id, name, email, seats },
        token: signupToken(signup.id),
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, reason: "already" };
    }
    throw error;
  }
}

export type SignupView = {
  id: string;
  name: string;
  seats: number;
  confirmed: boolean;
  /** Not confirmed within 30 minutes: the Seats went back. */
  expired: boolean;
  event: {
    title: string;
    slug: string;
    startsAt: Date;
    priceCents: number | null;
  };
};

/**
 * A Sign-up for the guest holding its email link; "cancelled" when the link
 * is good but the Sign-up is gone; null for a wrong link.
 */
export async function signupForGuest(
  id: string,
  token: string
): Promise<SignupView | "cancelled" | null> {
  if (!tokenMatches(id, token)) return null;
  const row = await db.eventSignup.findUnique({
    where: { id },
    include: {
      event: {
        select: { title: true, slug: true, startsAt: true, priceCents: true },
      },
    },
  });
  if (!row) return "cancelled";
  return {
    id: row.id,
    name: row.name,
    seats: row.seats,
    confirmed: row.confirmedAt !== null,
    expired: row.confirmedAt === null && row.createdAt <= holdStart(now()),
    event: row.event,
  };
}

export type ConfirmResult =
  { ok: true } | { ok: false; reason: "not_found" | "expired" | "closed" };

/** The email link confirms a waiting Sign-up, within 30 minutes (8.7). */
export async function confirmSignup(
  id: string,
  token: string
): Promise<ConfirmResult> {
  if (!tokenMatches(id, token)) return { ok: false, reason: "not_found" };
  return db.$transaction(async (tx): Promise<ConfirmResult> => {
    const row = await tx.eventSignup.findUnique({
      where: { id },
      select: { eventId: true, confirmedAt: true, createdAt: true },
    });
    if (!row) return { ok: false, reason: "not_found" };
    if (row.confirmedAt) return { ok: true };
    // signUpForEvent's lock, so the hold can't run out mid-count.
    const [event] = await tx.$queryRaw<{ startsAt: Date }[]>`
      SELECT starts_at AS "startsAt" FROM events
      WHERE id = ${row.eventId} FOR UPDATE`;
    const at = now();
    if (row.createdAt <= holdStart(at)) return { ok: false, reason: "expired" };
    if (!event || event.startsAt <= at) return { ok: false, reason: "closed" };
    await tx.eventSignup.update({ where: { id }, data: { confirmedAt: at } });
    return { ok: true };
  });
}

/** The email link cancels a Sign-up and gives its Seats back (8.7). */
export async function cancelSignup(
  id: string,
  token: string
): Promise<{ ok: true; slug: string } | { ok: false; reason: "not_found" }> {
  if (!tokenMatches(id, token)) return { ok: false, reason: "not_found" };
  const row = await db.eventSignup.findUnique({
    where: { id },
    select: { event: { select: { slug: true } } },
  });
  if (!row) return { ok: false, reason: "not_found" };
  await db.eventSignup.deleteMany({ where: { id } });
  return { ok: true, slug: row.event.slug };
}

/** Sign-ups holding Seats for an Event, oldest first, for the Manager. */
export async function signupsForEvent(eventId: string) {
  return db.eventSignup.findMany({
    where: { eventId, ...heldSignups(now()) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      seats: true,
      confirmedAt: true,
      createdAt: true,
    },
  });
}
