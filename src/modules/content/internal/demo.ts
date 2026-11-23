import { manila } from "@/lib/clock";
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
  const demo = await db.event.findMany({
    where: { slug: { in: DEMO_EVENTS } },
    orderBy: { slug: "asc" },
  });
  // The evenings a demo Event already holds: the two never share one. Seeded
  // two weeks apart on the same weekday, both once rolled to the same
  // Saturday at 7 PM (unslop pass, 14.2).
  const taken = new Set(
    demo.filter((event) => event.endsAt > at).map((e) => manila(e.startsAt).day)
  );
  const ended = demo.filter((event) => event.endsAt <= at);
  for (const event of ended) {
    const dayAfter = (weeks: number) =>
      manila(new Date(event.startsAt.getTime() + weeks * WEEK_MS)).day;
    let weeks =
      Math.floor((at.getTime() - event.startsAt.getTime()) / WEEK_MS) + 1;
    while (taken.has(dayAfter(weeks))) weeks++;
    taken.add(dayAfter(weeks));
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
