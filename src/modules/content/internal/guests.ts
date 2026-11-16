import { db, inTransaction, type Client } from "@/lib/db";

/**
 * Event Sign-ups and Inquiries sent with an email, for "Download my data"
 * (audit ID2-09, SEC1-19). Matched without case: people type it either way.
 */
export async function guestRecordsFor(email: string) {
  const match = { email: { equals: email, mode: "insensitive" as const } };
  const [signups, inquiries] = await Promise.all([
    db.eventSignup.findMany({
      where: match,
      orderBy: { createdAt: "asc" },
      select: {
        name: true,
        email: true,
        seats: true,
        confirmedAt: true,
        createdAt: true,
        event: { select: { title: true, startsAt: true } },
      },
    }),
    db.inquiry.findMany({
      where: match,
      orderBy: { createdAt: "asc" },
      select: {
        kind: true,
        name: true,
        email: true,
        wantedOn: true,
        guests: true,
        message: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);
  return { signups, inquiries };
}

/**
 * Deleting an account leaves its Sign-ups and Inquiries without the person
 * (audit SEC1-19). A Sign-up keeps its Seats, and each needs its own email
 * (one per Event), so it gets one made from its id.
 */
export async function forgetGuest(email: string, client: Client = db) {
  await inTransaction(client, async (tx) => {
    await tx.$executeRaw`
      UPDATE event_signups
      SET name = 'Deleted guest', email = 'deleted-' || id || '@hoshikopi.invalid'
      WHERE lower(email) = lower(${email})`;
    await tx.inquiry.updateMany({
      where: { email: { equals: email, mode: "insensitive" } },
      data: {
        name: "Deleted customer",
        email: "deleted@hoshikopi.invalid",
        message: "Removed when its sender deleted their account.",
      },
    });
  });
}
