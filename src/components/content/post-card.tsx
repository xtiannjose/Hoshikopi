import Link from "next/link";

import { Photo } from "@/components/photo";
import { formatDate } from "@/lib/clock";
import type { PostCard as Post } from "@/modules/content";

/** A Post: cover, date, title, excerpt (NEWS-01). The lead card spans two
 * columns from lg up; `sizes` overrides the photo hint in two-up grids. */
export function PostCard({
  post,
  headingLevel = 2,
  lead = false,
  sizes,
}: {
  post: Post;
  headingLevel?: 2 | 3;
  lead?: boolean;
  sizes?: string;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <article
      className={`group lift reveal relative grid content-start gap-3 ${lead ? "lg:col-span-2" : ""}`}
    >
      <Photo
        src={post.coverUrl}
        alt={post.coverAlt ?? post.title}
        kind="post"
        sizes={
          sizes ??
          (lead
            ? "(min-width: 1536px) 60rem, (min-width: 1024px) 66vw, 100vw"
            : "(min-width: 1536px) 22rem, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw")
        }
        className="rounded-card aspect-16/9"
      />
      <p className="text-muted-foreground font-mono text-sm">
        {formatDate(post.publishedAt)}
      </p>
      <Heading
        className={`font-display pb-1 italic ${lead ? "text-4xl" : "text-2xl"}`}
      >
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
