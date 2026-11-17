import { notFound } from "next/navigation";

import { SHARE_SIZE, shareCard } from "@/components/share-card";
import { formatPrice } from "@/lib/money";
import { getMenuItem, menuSlugs } from "@/modules/menu";

// shortcut: the card shows the name and Base Price; add the Menu Item's
// concept image once pictures exist (ADR 0012).
export const alt =
  "The Menu Item's name and Base Price on the Hoshikopi night sky";
export const size = SHARE_SIZE;
export const contentType = "image/png";

// Rendered at build like the pages; a made-up slug has no card (audit
// PERF-15, SEC1-12).
export async function generateStaticParams() {
  const { items } = await menuSlugs();
  // Cache Components needs at least one, or the build fails when every
  // Category is Hidden (audit DC-27); an unknown one is not found.
  return items.length ? items.map((slug) => ({ slug })) : [{ slug: "none" }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getMenuItem((await params).slug);
  if (!item) notFound();
  return shareCard(
    item.name,
    `${formatPrice(item.baseCents)}. Order ahead for pickup.`
  );
}
