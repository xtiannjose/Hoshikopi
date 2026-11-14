import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  CalendarBlankIcon,
  MapPinIcon,
  TicketIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { mapsUrl } from "@/components/cafe/maps";
import { eventPrice, eventWhen } from "@/components/content/event-card";
import { Markdown } from "@/components/markdown";
import { IconCircle, OUTLINE_PILL, PRIMARY_PILL } from "@/components/panel";
import { Photo } from "@/components/photo";
import { formatDate, formatTime } from "@/lib/clock";
import { formatDecimal, formatPrice } from "@/lib/money";
import { getCafeDetails } from "@/modules/cafe";
import { getEvent, getEvents } from "@/modules/content";

import { SignupForm } from "./signup-form";

export async function generateStaticParams() {
  const { upcoming, past } = await getEvents();
  const slugs = [...upcoming, ...past].map((event) => ({ slug: event.slug }));
  // Cache Components needs at least one; an unknown slug is not found.
  return slugs.length ? slugs : [{ slug: "none" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]">): Promise<Metadata> {
  const event = await getEvent((await params).slug);
  return event
    ? { title: event.title, description: event.summary }
    : { title: "Page not found" };
}

export default function EventPage({ params }: PageProps<"/events/[slug]">) {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <div className="w-full max-w-6xl">
        <Suspense fallback={<div className="min-h-96" />}>
          <Event params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function Event({ params }: Pick<PageProps<"/events/[slug]">, "params">) {
  const slug = (await params).slug;
  const [event, { past }, cafe] = await Promise.all([
    getEvent(slug),
    getEvents(),
    getCafeDetails(),
  ]);
  if (!event) notFound();
  // An Event is upcoming or past, never both; past means it has ended.
  const ended = past.some((e) => e.slug === event.slug);
  const calendar = `/events/${event.slug}/calendar`;
  const directions = mapsUrl(cafe);
  // Event structured data (INFO-02): no street address, an invented place.
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: event.startsAt.toISOString(),
    endDate: event.endsAt.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: "Hoshikopi",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Kapitolyo, Pasig",
        addressCountry: "PH",
      },
    },
    offers: {
      "@type": "Offer",
      price: formatDecimal(event.priceCents ?? 0),
      priceCurrency: "PHP",
      availability: "https://schema.org/InStock",
      url: event.signupUrl ?? undefined,
    },
    organizer: { "@type": "Organization", name: "Hoshikopi" },
  };
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data).replace(/</g, "\\u003c"),
        }}
      />
      <BackLink href="/events">Events</BackLink>
      {ended && (
        <p className="bg-muted rounded-card mt-4 p-4 text-lg">
          This Event has ended. Salamat to everyone who came!{" "}
          <Link href="/events" className="font-semibold">
            See what&apos;s on
          </Link>
        </p>
      )}
      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="max-w-measure grid content-start gap-6">
          <header className="grid gap-2">
            <p className="text-muted-foreground font-mono text-sm">
              {eventWhen(event)}
            </p>
            <h1 className="font-display pb-1 text-5xl leading-[1.1] italic md:text-6xl">
              {event.title}
            </h1>
            <p className="text-lg">{event.summary}</p>
          </header>
          <Photo
            src={event.photoUrl}
            alt={event.photoAlt ?? event.title}
            kind="event"
            sizes="(min-width: 1024px) 45rem, 100vw"
            priority
            className="rounded-card aspect-16/9"
          />
          <div className="text-lg">
            <Markdown>{event.bodyMd}</Markdown>
          </div>
        </div>
        <aside
          aria-label="Event details"
          className="border-input bg-muted rounded-card border border-dashed p-5 lg:sticky lg:top-6"
        >
          <ul className="grid gap-4">
            <li className="flex items-center gap-3">
              <IconCircle tone="background">
                <CalendarBlankIcon size={20} />
              </IconCircle>
              <span className="font-mono">
                <span className="block">{formatDate(event.startsAt)}</span>
                <span className="block text-sm">
                  {formatTime(event.startsAt)} to {formatTime(event.endsAt)}
                </span>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <IconCircle tone="background">
                <TicketIcon size={20} />
              </IconCircle>
              <span className="font-mono">{eventPrice(event)}</span>
            </li>
            <li className="flex items-center gap-3">
              <IconCircle tone="background">
                <MapPinIcon size={20} />
              </IconCircle>
              <span>
                <span className="block">{cafe.area}</span>
                <a href={directions}>Get directions</a>
              </span>
            </li>
          </ul>
          {!ended && event.seats !== null && (
            <section
              aria-labelledby="signup"
              className="border-input mt-5 border-t border-dashed pt-5"
            >
              <h2 id="signup" className="font-display pb-1 text-3xl italic">
                Sign up
              </h2>
              {event.seatsLeft ? (
                <>
                  <p
                    className={`mt-2 ${event.seatsLeft <= 3 ? "text-warning font-semibold" : ""}`}
                  >
                    {event.seatsLeft <= 3
                      ? `Only ${event.seatsLeft} ${event.seatsLeft === 1 ? "seat" : "seats"} left.`
                      : `${event.seatsLeft} of ${event.seats} seats left.`}
                  </p>
                  <SignupForm
                    slug={event.slug}
                    seatsLeft={event.seatsLeft}
                    price={
                      event.priceCents ? formatPrice(event.priceCents) : null
                    }
                    startsAt={event.startsAt.toISOString()}
                    calendar={calendar}
                    directions={directions}
                  />
                </>
              ) : (
                <p className="mt-2 text-lg">Fully booked, sorry.</p>
              )}
            </section>
          )}
          {!ended && (
            <p className="mt-5 flex flex-wrap gap-3">
              {event.signupUrl && (
                <a href={event.signupUrl} className={PRIMARY_PILL}>
                  Sign up
                </a>
              )}
              {/* A calendar file for Google, Apple and Outlook (EVT-04). */}
              <a
                href={calendar}
                download={`${event.slug}.ics`}
                className={`${OUTLINE_PILL} bg-background`}
              >
                Add to calendar
              </a>
            </p>
          )}
        </aside>
      </div>
      <p className="text-muted-foreground mt-10 font-mono text-sm">
        This Event is an example: Hoshikopi is a concept cafe.
      </p>
    </article>
  );
}
