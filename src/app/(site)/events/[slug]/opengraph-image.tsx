import { notFound } from "next/navigation";

import { eventWhen } from "@/components/content/event-card";
import { SHARE_SIZE, shareCard } from "@/components/share-card";
import { getEvent, getEvents } from "@/modules/content";

// shortcut: shows the title and date; add the Event's photo once photos exist.
export const alt = "A Hoshikopi Event with its date on the night sky";
export const size = SHARE_SIZE;
export const contentType = "image/png";

// Rendered at build like the pages; a made-up slug has no card (audit
// PERF-15, SEC1-12).
export async function generateStaticParams() {
  const { upcoming, past } = await getEvents();
  const slugs = [...upcoming, ...past].map((event) => ({ slug: event.slug }));
  return slugs.length ? slugs : [{ slug: "none" }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const event = await getEvent((await params).slug);
  if (!event) notFound();
  return shareCard(event.title, eventWhen(event));
}
