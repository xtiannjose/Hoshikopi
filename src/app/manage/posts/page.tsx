import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { formatDate } from "@/lib/clock";
import { contentForStaff } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

export const metadata: Metadata = { title: "Posts" };

export default function ManagePostsPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage">Manage</Link>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">Posts</h1>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <List />
      </Suspense>
    </main>
  );
}

async function List() {
  await requireStaff("manager", "/manage/posts");
  const { posts } = await contentForStaff();
  return (
    <div className="mt-6 grid gap-4">
      <Link href="/manage/posts/new" className="font-semibold">
        Write a Post
      </Link>
      <ul className="border-border border-t">
        {posts.map((post) => (
          <li key={post.id} className="border-border border-b py-3">
            <Link href={`/manage/posts/${post.id}`}>{post.title}</Link>
            <span className="text-muted-foreground block text-sm">
              {post.publishedAt ? formatDate(post.publishedAt) : "Draft"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
