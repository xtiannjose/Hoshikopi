import { SHARE_SIZE, shareCard } from "@/components/share-card";

// The one branded share card for every page without its own (INFO-09).
export const alt =
  "Hoshikopi, a concept cafe in Kapitolyo, Pasig: a gold star on a night sky.";
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return shareCard(
    "Hoshikopi",
    "Your kopi, ready before you get here. Kapitolyo, Pasig."
  );
}
