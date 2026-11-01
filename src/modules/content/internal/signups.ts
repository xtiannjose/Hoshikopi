import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { now } from "@/lib/clock";
import { db } from "@/lib/db";

const SignupInput = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .regex(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Enter an email address, like hoshi@example.com."
    ),
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
      signup: { name: string; email: string; seats: number };
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
 * row is locked while Seats are counted, so two at once never oversell.
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
  try {
    return await db.$transaction(async (tx): Promise<SignupResult> => {
      const [event] = await tx.$queryRaw<LockedEvent[]>`
        SELECT id, title, slug, starts_at AS "startsAt",
               price_cents AS "priceCents", seats, is_published AS "isPublished"
        FROM events WHERE slug = ${slug} FOR UPDATE`;
      if (
        !event?.isPublished ||
        event.seats === null ||
        event.startsAt <= now()
      ) {
        return { ok: false, reason: "closed" };
      }
      const taken = await tx.eventSignup.aggregate({
        where: { eventId: event.id },
        _sum: { seats: true },
      });
      const left = event.seats - (taken._sum.seats ?? 0);
      if (left <= 0) return { ok: false, reason: "full", seatsLeft: 0 };
      if (seats > left) {
        return { ok: false, reason: "too_many_seats", seatsLeft: left };
      }
      await tx.eventSignup.create({
        data: { eventId: event.id, name, email, seats, createdAt: now() },
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
        signup: { name, email, seats },
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

/** Who signed up for an Event, oldest first, for the Manager. */
export async function signupsForEvent(eventId: string) {
  return db.eventSignup.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, seats: true, createdAt: true },
  });
}
