import type { Metadata } from "next";
import Link from "next/link";
import { NewspaperIcon } from "@phosphor-icons/react/ssr";

import { PostCard } from "@/components/content/post-card";
import { PageHeader } from "@/components/page-header";
import { Empty, PRIMARY_PILL } from "@/components/panel";
import { getPosts } from "@/modules/content";

export const metadata: Metadata = {
  title: "News",
  description: "New drinks, the farms behind our beans and news from the bar.",
};

export default async function NewsPage() {
  const posts = await getPosts();
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <PageHeader
        title="News"
        intro="New drinks, the farms behind our beans and news from the bar."
      />
      {posts.length === 0 ? (
        <div className="mt-8">
          <Empty icon={<NewspaperIcon size={24} />}>
            <p className="text-lg">
              No posts yet. While you wait, the menu&apos;s open.
            </p>
            <Link href="/menu" className={PRIMARY_PILL}>
              See the menu
            </Link>
          </Empty>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {posts.map((post, index) => (
            <PostCard key={post.slug} post={post} lead={index === 0} />
          ))}
        </div>
      )}
    </main>
  );
}
