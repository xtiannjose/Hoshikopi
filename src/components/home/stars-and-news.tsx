import Link from "next/link";
import {
  ArrowRightIcon,
  CoffeeIcon,
  StorefrontIcon,
  UserIcon,
} from "@phosphor-icons/react/ssr";

import { EventCard } from "@/components/content/event-card";
import { PostCard } from "@/components/content/post-card";
import { IconCircle } from "@/components/panel";
import { StarCard } from "@/components/star-card";
import type { EventCard as Event, PostCard as Post } from "@/modules/content";

// No gold here: the Star Card beside it has it.
const HOW = [
  { icon: UserIcon, label: "Sign in and order ahead" },
  { icon: StorefrontIcon, label: "Pick up at the counter" },
  { icon: CoffeeIcon, label: "Nine Stars make a free drink" },
];

const MORE_LINK =
  "inline-flex min-h-11 items-center gap-1 justify-self-start no-underline hover:underline";

/** Home: the Star Card and how Stars work, then the next Event beside the
 * latest Post. */
export function StarsAndNews({
  event,
  post,
}: {
  event: Event | null;
  post: Post | null;
}) {
  return (
    <div className="grid gap-24">
      <section
        aria-labelledby="stars"
        className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-16"
      >
        <h2 id="stars" className="sr-only">
          Stars
        </h2>
        <div className="grid gap-4">
          <StarCard balance={5} />
          <p className="text-muted-foreground font-mono text-sm">
            Example card: 5 of 9, four drinks to go.
          </p>
        </div>
        <div className="grid content-start gap-6">
          <h3 className="font-display pb-1 text-3xl italic">How Stars work</h3>
          <ol className="grid gap-4">
            {HOW.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-4">
                <IconCircle>
                  <Icon size={20} />
                </IconCircle>
                <span className="font-semibold">{label}</span>
              </li>
            ))}
          </ol>
          <Link
            href="/sign-in?next=/account"
            className="border-input inline-flex min-h-12 w-fit items-center rounded-full border px-6 font-semibold no-underline"
          >
            Get your Star Card
          </Link>
        </div>
      </section>

      {(event || post) && (
        <div className="grid gap-12 md:grid-cols-2">
          {event && (
            <section aria-labelledby="next-event" className="grid gap-4">
              <h2 id="next-event" className="font-display text-3xl italic">
                Upcoming event
              </h2>
              <EventCard event={event} headingLevel={3} />
              <Link href="/events" className={MORE_LINK}>
                See all Events
                <ArrowRightIcon aria-hidden size={16} />
              </Link>
            </section>
          )}
          {post && (
            <section aria-labelledby="latest-post" className="grid gap-4">
              <h2 id="latest-post" className="font-display text-3xl italic">
                Latest post
              </h2>
              <PostCard post={post} headingLevel={3} />
              <Link href="/news" className={MORE_LINK}>
                More news
                <ArrowRightIcon aria-hidden size={16} />
              </Link>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
