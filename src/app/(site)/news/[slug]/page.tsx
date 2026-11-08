import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import { PostCard } from "@/components/content/post-card";
import { Markdown } from "@/components/markdown";
import { PRIMARY_PILL } from "@/components/panel";
import { Photo } from "@/components/photo";
import { formatDate } from "@/lib/clock";
import { getPost, getPosts } from "@/modules/content";

export async function generateStaticParams() {
  const slugs = (await getPosts()).map((post) => ({ slug: post.slug }));
  return slugs.length ? slugs : [{ slug: "none" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/news/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post
    ? {
        title: post.title,
        description: post.excerpt,
        openGraph: { type: "article" },
      }
    : {};
}

export default function PostPage({ params }: PageProps<"/news/[slug]">) {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <Suspense fallback={<div className="min-h-96" />}>
        <Post params={params} />
      </Suspense>
    </main>
  );
}

// The first paragraph opens with a drop cap in the display face.
const DROP_CAP =
  "[&>div>p:first-of-type]:first-letter:float-left [&>div>p:first-of-type]:first-letter:pr-2 [&>div>p:first-of-type]:first-letter:font-display [&>div>p:first-of-type]:first-letter:text-6xl [&>div>p:first-of-type]:first-letter:italic";

async function Post({ params }: Pick<PageProps<"/news/[slug]">, "params">) {
  const slug = (await params).slug;
  const posts = await getPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  // Newest first, so these are the two newest other Posts.
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 2);
  return (
    <>
      <article>
        {/* text-lg on the header and the body, so the measure (in em) lines them up. */}
        <header className="max-w-measure mx-auto grid gap-2 text-lg">
          <BackLink href="/news">News</BackLink>
          <p className="text-muted-foreground font-mono text-sm">
            From the bar · {formatDate(post.publishedAt)}
          </p>
          <h1 className="font-display pb-1 text-5xl leading-[1.1] italic md:text-6xl">
            {post.title}
          </h1>
          <p className="text-muted-foreground">{post.excerpt}</p>
        </header>
        <Photo
          src={post.coverUrl}
          alt={post.coverAlt ?? post.title}
          kind="post"
          sizes="(min-width: 1024px) 64rem, 100vw"
          priority
          className="rounded-card mx-auto mt-8 aspect-16/9 max-w-5xl"
        />
        <div className={`max-w-measure mx-auto mt-10 text-lg ${DROP_CAP}`}>
          <Markdown>{post.bodyMd}</Markdown>
        </div>
      </article>
      {more.length > 0 && (
        <section aria-labelledby="keep-reading" className="mt-20">
          <h2 id="keep-reading" className="font-display pb-1 text-4xl italic">
            Keep reading
          </h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {more.map((p) => (
              <PostCard
                key={p.slug}
                post={p}
                headingLevel={3}
                sizes="(min-width: 1536px) 45rem, (min-width: 768px) 50vw, 100vw"
              />
            ))}
          </div>
        </section>
      )}
      <section
        aria-labelledby="thirsty"
        className="border-input rounded-card mt-16 flex flex-wrap items-center justify-between gap-4 border border-dashed p-6"
      >
        <div className="grid gap-1">
          <h2 id="thirsty" className="font-display pb-1 text-3xl italic">
            Thirsty now?
          </h2>
          <p className="text-muted-foreground">
            Order ahead and pick it up at the counter.
          </p>
        </div>
        <Link href="/menu" className={PRIMARY_PILL}>
          Order ahead
        </Link>
      </section>
    </>
  );
}
