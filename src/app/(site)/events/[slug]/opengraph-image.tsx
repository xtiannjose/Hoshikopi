import { eventWhen } from "@/components/content/event-card";
import { SHARE_SIZE, shareCard } from "@/components/share-card";
import { getEvent } from "@/modules/content";

// shortcut: shows the title and date; add the Event's photo once photos exist.
export const alt = "A Hoshikopi Event with its date on the night sky";
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const event = await getEvent((await params).slug);
  return shareCard(event?.title ?? "Hoshikopi", event ? eventWhen(event) : "");
}
