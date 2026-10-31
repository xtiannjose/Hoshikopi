import { SHARE_SIZE, shareCard } from "@/components/share-card";
import { formatPrice } from "@/lib/money";
import { getMenuItem } from "@/modules/menu";

// shortcut: the card shows the name and Base Price; add the Menu Item's
// concept image once pictures exist (ADR 0012).
export const alt =
  "The Menu Item's name and Base Price on the Hoshikopi night sky";
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const item = await getMenuItem((await params).slug);
  return shareCard(
    item?.name ?? "Hoshikopi",
    item ? `${formatPrice(item.baseCents)}. Order ahead for pickup.` : ""
  );
}
