import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewspaperIcon, PencilSimpleIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Empty, IconCircle, Pill, PRIMARY_PILL } from "@/components/panel";
import { formatDate } from "@/lib/clock";
import { contentForStaff } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

export const metadata: Metadata = { title: "Posts" };

const WRITE = (
  <Link href="/manage/posts/new" className={PRIMARY_PILL}>
    <PencilSimpleIcon aria-hidden size={18} />
    Write a Post
  </Link>
);

export default function ManagePostsPage() {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <div className="grid gap-8">
        <PageHeader
          back={<BackLink href="/manage">Manage</BackLink>}
          title="Posts"
          size="staff"
          intro="News from the cafe. Drafts stay here until you publish them."
          actions={WRITE}
        />
        <Suspense fallback={<p>Loading...</p>}>
          <List />
        </Suspense>
      </div>
    </main>
  );
}

async function List() {
  await requireStaff("manager", "/manage/posts");
  const { posts } = await contentForStaff();
  if (posts.length === 0) {
    return (
      <Empty icon={<NewspaperIcon size={24} />}>
        <p>
          No Posts yet. A new drink or a story about your beans makes a good
          first one.
        </p>
        {WRITE}
      </Empty>
    );
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <li
          key={post.id}
          className="rounded-card border-border hover:bg-muted relative flex gap-4 border p-4"
        >
          <IconCircle>
            <NewspaperIcon size={20} />
          </IconCircle>
          <div className="grid min-w-0 content-start gap-1.5">
            {/* The whole tile opens the Post; the title is the link's name. */}
            <Link
              href={`/manage/posts/${post.id}`}
              className="font-semibold after:absolute after:inset-0"
            >
              {post.title}
            </Link>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {post.excerpt}
            </p>
            <p>
              {post.publishedAt ? (
                <Pill tone="success">
                  Published {formatDate(post.publishedAt)}
                </Pill>
              ) : (
                <Pill tone="muted">Draft</Pill>
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
