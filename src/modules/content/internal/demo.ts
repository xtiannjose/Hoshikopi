import { db } from "@/lib/db";

// The seeded demo Events (prisma/seed-data.ts); an Event a Manager makes is
// never moved.
const DEMO_EVENTS = ["latte-art-night", "open-mic-under-the-stars"];
const WEEK_MS = 7 * 86_400_000;

/**
 * Keeps the hosted demo's Events ahead (Demo Mode, ADR 0015): a demo Event
 * that has ended moves forward by whole weeks, keeping its weekday, time and
 * length, and its old Sign-ups go. The daily cron calls it in Demo Mode
 * only. Returns how many moved.
 */
export async function rollDemoEvents(at: Date): Promise<number> {
  const ended = await db.event.findMany({
    where: { slug: { in: DEMO_EVENTS }, endsAt: { lte: at } },
  });
  for (const event of ended) {
    const weeks =
      Math.floor((at.getTime() - event.startsAt.getTime()) / WEEK_MS) + 1;
    const shift = weeks * WEEK_MS;
    await db.$transaction([
      db.eventSignup.deleteMany({ where: { eventId: event.id } }),
      db.event.update({
        where: { id: event.id },
        data: {
          startsAt: new Date(event.startsAt.getTime() + shift),
          endsAt: new Date(event.endsAt.getTime() + shift),
        },
      }),
    ]);
  }
  return ended.length;
}
