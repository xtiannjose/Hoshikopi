import { notFound } from "next/navigation";

import { SHARE_SIZE, shareCard } from "@/components/share-card";
import { getPost, getPosts } from "@/modules/content";

// shortcut: shows the title and excerpt; add the cover once photos exist.
export const alt = "A Hoshikopi news Post title on the night sky";
export const size = SHARE_SIZE;
export const contentType = "image/png";

// Rendered at build like the pages; a made-up slug has no card (audit
// PERF-15, SEC1-12).
export async function generateStaticParams() {
  const slugs = (await getPosts()).map((post) => ({ slug: post.slug }));
  return slugs.length ? slugs : [{ slug: "none" }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return shareCard(post.title, post.excerpt);
}
