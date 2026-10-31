import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Markdown } from "@/components/markdown";
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
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 md:px-8">
      <Suspense fallback={<div className="min-h-96" />}>
        <Post params={params} />
      </Suspense>
    </main>
  );
}

async function Post({ params }: Pick<PageProps<"/news/[slug]">, "params">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return (
    <article className="pt-6">
      <Link href="/news">All news</Link>
      <p className="text-muted-foreground mt-4 font-mono text-sm">
        {formatDate(post.publishedAt)}
      </p>
      <h1 className="font-display mt-2 pb-1 text-5xl leading-[1.1] italic">
        {post.title}
      </h1>
      <p className="text-muted-foreground mt-3 text-lg">{post.excerpt}</p>
      <Photo
        src={post.coverUrl}
        alt={post.coverAlt ?? post.title}
        kind="post"
        sizes="(min-width: 768px) 48rem, 100vw"
        priority
        className="rounded-card mt-6 aspect-16/9"
      />
      <div className="mt-8 text-lg">
        <Markdown>{post.bodyMd}</Markdown>
      </div>
    </article>
  );
}
