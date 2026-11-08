import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowSquareOutIcon, CheckCircleIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { OUTLINE_PILL, Pill } from "@/components/panel";
import { formatDate } from "@/lib/clock";
import { contentForStaff } from "@/modules/content";
import { requireStaff } from "@/modules/identity";

import { PostForm, type PostFormData } from "../../content-forms";

export const metadata: Metadata = { title: "Post" };

const back = <BackLink href="/manage/posts">Posts</BackLink>;

export default function ManagePostPage({
  params,
  searchParams,
}: PageProps<"/manage/posts/[id]">) {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <Suspense
        fallback={
          <div className="grid gap-2">
            {back}
            <p>Loading...</p>
          </div>
        }
      >
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Editor({
  params,
  searchParams,
}: Pick<PageProps<"/manage/posts/[id]">, "params" | "searchParams">) {
  await requireStaff("manager", "/manage/posts");
  const [{ id }, { added }] = await Promise.all([params, searchParams]);
  let post: PostFormData;
  if (id === "new") {
    post = {
      id: null,
      title: "",
      slug: "",
      excerpt: "",
      bodyMd: "",
      isPublished: false,
      publishedOn: null,
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
      publishedOn: row.publishedAt && formatDate(row.publishedAt),
    };
  }
  const href = `/news/${post.slug}`;
  return (
    <div className="grid gap-8">
      <PageHeader
        back={back}
        title={post.id ? post.title : "Write a Post"}
        size="staff"
        actions={
          post.id &&
          (post.isPublished ? (
            <Link href={href} className={OUTLINE_PILL}>
              See it on the site
              <ArrowSquareOutIcon aria-hidden size={18} />
            </Link>
          ) : (
            <Pill tone="muted">Draft: not on the site yet</Pill>
          ))
        }
      />
      {post.id && added && (
        <p className="bg-muted rounded-card flex flex-wrap items-center gap-3 p-4">
          <CheckCircleIcon aria-hidden size={22} className="text-success" />
          {post.isPublished ? (
            <>
              Added.{" "}
              <Link href={href} className="font-semibold">
                See it on the site
              </Link>
            </>
          ) : (
            "Saved as a draft. Tick Published on the site when it's ready."
          )}
        </p>
      )}
      <PostForm post={post} />
    </div>
  );
}
