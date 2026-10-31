import type { Metadata } from "next";

import { PostCard } from "@/components/content/post-card";
import { getPosts } from "@/modules/content";

export const metadata: Metadata = {
  title: "News",
  description: "New drinks, the farms behind our beans and news from the bar.",
};

export default async function NewsPage() {
  const posts = await getPosts();
  return (
    <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 md:px-8">
      <h1 className="font-display pt-8 pb-1 text-5xl italic md:text-6xl">
        News
      </h1>
      {posts.length === 0 ? (
        <p className="mt-6 text-lg">No news yet.</p>
      ) : (
        <div className="mt-8 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
