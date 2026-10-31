import Link from "next/link";

import { Photo } from "@/components/photo";
import { formatDate } from "@/lib/clock";
import type { PostCard as Post } from "@/modules/content";

/** A Post: cover, date, title, excerpt (NEWS-01). */
export function PostCard({
  post,
  headingLevel = 2,
}: {
  post: Post;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article className="group relative grid content-start gap-3">
      <Photo
        src={post.coverUrl}
        alt={post.coverAlt ?? post.title}
        kind="post"
        sizes="(min-width: 768px) 45vw, 100vw"
        className="rounded-card aspect-16/9"
      />
      <p className="text-muted-foreground font-mono text-sm">
        {formatDate(post.publishedAt)}
      </p>
      <Heading className="font-display pb-1 text-2xl italic">
        <Link
          href={`/news/${post.slug}`}
          className="no-underline group-hover:underline after:absolute after:inset-0"
        >
          {post.title}
        </Link>
      </Heading>
      <p className="text-muted-foreground">{post.excerpt}</p>
    </article>
  );
}
