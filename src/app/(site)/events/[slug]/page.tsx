import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { eventPrice, eventWhen } from "@/components/content/event-card";
import { Markdown } from "@/components/markdown";
import { Photo } from "@/components/photo";
import { getEvent, getEvents } from "@/modules/content";

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
  return event ? { title: event.title, description: event.summary } : {};
}

export default function EventPage({ params }: PageProps<"/events/[slug]">) {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 md:px-8">
      <Suspense fallback={<div className="min-h-96" />}>
        <Event params={params} />
      </Suspense>
    </main>
  );
}

async function Event({ params }: Pick<PageProps<"/events/[slug]">, "params">) {
  const event = await getEvent((await params).slug);
  if (!event) notFound();
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
      price: ((event.priceCents ?? 0) / 100).toFixed(2),
      priceCurrency: "PHP",
      availability: "https://schema.org/InStock",
      url: event.signupUrl ?? undefined,
    },
    organizer: { "@type": "Organization", name: "Hoshikopi" },
  };
  return (
    <article className="pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data).replace(/</g, "\\u003c"),
        }}
      />
      <Link href="/events">All Events</Link>
      <p className="text-muted-foreground mt-4 font-mono text-sm">
        {eventWhen(event)}
      </p>
      <h1 className="font-display mt-2 pb-1 text-5xl leading-[1.1] italic">
        {event.title}
      </h1>
      <p className="mt-3 text-lg">{event.summary}</p>
      <p className="mt-2 font-mono">{eventPrice(event)}</p>
      <Photo
        src={event.photoUrl}
        alt={event.photoAlt ?? event.title}
        kind="event"
        sizes="(min-width: 768px) 48rem, 100vw"
        priority
        className="rounded-card mt-6 aspect-16/9"
      />
      <div className="mt-8 text-lg">
        <Markdown>{event.bodyMd}</Markdown>
      </div>
      <p className="mt-8 flex flex-wrap gap-3">
        {event.signupUrl && (
          <a
            href={event.signupUrl}
            className="bg-primary text-primary-foreground inline-flex min-h-12 items-center rounded-full px-6 font-semibold no-underline"
          >
            Sign up
          </a>
        )}
        {/* A calendar file for Google, Apple and Outlook (EVT-04). */}
        <a
          href={`/events/${event.slug}/calendar`}
          download={`${event.slug}.ics`}
          className="border-input inline-flex min-h-12 items-center rounded-full border px-6 font-semibold no-underline"
        >
          Add to calendar
        </a>
      </p>
      <p className="text-muted-foreground mt-10 font-mono text-sm">
        This Event is an example: Hoshikopi is a concept cafe.
      </p>
    </article>
  );
}
