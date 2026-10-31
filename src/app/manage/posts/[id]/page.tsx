import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { contentForStaff } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

import { PostForm, type PostFormData } from "../../content-forms";

export const metadata: Metadata = { title: "Post" };

export default function ManagePostPage({
  params,
}: PageProps<"/manage/posts/[id]">) {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link href="/manage/posts">All Posts</Link>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <Editor params={params} />
      </Suspense>
    </main>
  );
}

async function Editor({
  params,
}: Pick<PageProps<"/manage/posts/[id]">, "params">) {
  await requireStaff("manager", "/manage/posts");
  const { id } = await params;
  let post: PostFormData;
  if (id === "new") {
    post = {
      id: null,
      title: "",
      slug: "",
      excerpt: "",
      bodyMd: "",
      isPublished: false,
    };
  } else {
    const row = (await contentForStaff()).posts.find((p) => p.id === id);
    if (!row) notFound();
    post = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      bodyMd: row.bodyMd,
      isPublished: row.publishedAt !== null,
    };
  }
  return (
    <>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">
        {post.id ? post.title : "Write a Post"}
      </h1>
      <PostForm post={post} />
    </>
  );
}
