import Link from "next/link";

import { EventCard } from "@/components/content/event-card";
import { PostCard } from "@/components/content/post-card";
import { StarCard } from "@/components/star-card";
import type { EventCard as Event, PostCard as Post } from "@/modules/content";

/** Home: the Star Card, then the next Event beside the latest Post. */
export function StarsAndNews({
  event,
  post,
}: {
  event: Event | null;
  post: Post | null;
}) {
  return (
    <div className="grid gap-24">
      <section aria-labelledby="stars" className="grid gap-4">
        <h2 id="stars" className="sr-only">
          Stars
        </h2>
        <StarCard balance={5} />
        <p className="text-muted-foreground font-mono text-sm">
          Example card: 5 of 9, four drinks to go.
        </p>
        <Link
          href="/sign-in?next=/account"
          className="border-input inline-flex min-h-12 w-fit items-center rounded-full border px-6 font-semibold no-underline"
        >
          Get your Star Card
        </Link>
      </section>

      {(event || post) && (
        <div className="grid gap-12 md:grid-cols-2">
          {event && (
            <section aria-labelledby="next-event" className="grid gap-4">
              <h2 id="next-event" className="font-display text-3xl italic">
                Upcoming event
              </h2>
              <EventCard event={event} headingLevel={3} />
              <Link href="/events">See all Events</Link>
            </section>
          )}
          {post && (
            <section aria-labelledby="latest-post" className="grid gap-4">
              <h2 id="latest-post" className="font-display text-3xl italic">
                Latest post
              </h2>
              <PostCard post={post} headingLevel={3} />
              <Link href="/news">More news</Link>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
