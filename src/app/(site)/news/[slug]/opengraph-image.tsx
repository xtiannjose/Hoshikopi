import { SHARE_SIZE, shareCard } from "@/components/share-card";
import { getPost } from "@/modules/content";

// shortcut: shows the title and excerpt; add the cover once photos exist.
export const alt = "A Hoshikopi news Post title on the night sky";
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await getPost((await params).slug);
  return shareCard(post?.title ?? "Hoshikopi", post?.excerpt ?? "");
}
