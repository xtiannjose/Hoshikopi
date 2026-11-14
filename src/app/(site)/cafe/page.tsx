import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarStarIcon,
  EnvelopeIcon,
  MapPinIcon,
} from "@phosphor-icons/react/ssr";

import { AmenityList } from "@/components/cafe/amenity-list";
import { HoursList } from "@/components/cafe/hours-list";
import { mapsUrl } from "@/components/cafe/maps";
import { OpenStatus } from "@/components/cafe/open-status";
import { WeeklyList } from "@/components/content/weekly-list";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import { OUTLINE_PILL, Panel, PRIMARY_PILL } from "@/components/panel";
import { Photo } from "@/components/photo";
import { PickupLine } from "@/components/pickup-line";
import {
  getCafeDetails,
  getHours,
  ROOM_PHOTOS,
  type CafeDetails,
} from "@/modules/cafe";
import type { Hours } from "@/lib/hours";
import { GUEST_PAY_AT_PICKUP_MAX_DRINKS } from "@/modules/ordering";
import { getRecurringEvents } from "@/modules/content";
import { STARS_PER_REWARD } from "@/modules/loyalty";

export const metadata: Metadata = {
  title: "Visit",
  description:
    "Hours, directions, Wi-Fi, outlets and pets at Hoshikopi in Kapitolyo, Pasig. Walk in and stay, or order ahead for pickup.",
};

function faq(cafe: CafeDetails): [string, string][] {
  const rows: ([string, string] | null)[] = [
    [
      "Can I stay and eat here?",
      "Yes. Walk in and find a seat; we don't take table bookings. Orders on this site are for pickup at the counter.",
    ],
    cafe.powerOutlets === null && cafe.wifi === null
      ? null
      : [
          "Can I work on my laptop?",
          [
            cafe.powerOutlets ? "Yes." : "Yes, though we have no outlets.",
            cafe.laptopNote,
            cafe.wifi ? "Ask for the Wi-Fi password at the bar." : null,
          ]
            .filter(Boolean)
            .join(" "),
        ],
    cafe.petsAllowed === null
      ? null
      : [
          "Can I bring my dog?",
          cafe.petsAllowed
            ? `Yes. ${cafe.petsNote ?? ""}`.trim()
            : "Sorry, no pets inside.",
        ],
    cafe.parkingNote ? ["Where do I park?", cafe.parkingNote] : null,
    [
      "Can I cancel my order?",
      "Yes, until the bar accepts it. If you paid online, you get a full refund.",
    ],
    [
      "Can I pay at the counter?",
      `Yes. As a guest, for up to ${GUEST_PAY_AT_PICKUP_MAX_DRINKS} drinks; signed in, for any order.`,
    ],
    [
      "How do Stars work?",
      `Sign in when you order and every drink earns one Star. ${STARS_PER_REWARD} Stars get you a free drink; extras like Large or oat milk still add their price.`,
    ],
    [
      "What about big orders?",
      "One online order fits one Pickup Window, about a dozen drinks. For more, send an inquiry from this page a day ahead and we'll get it ready.",
    ],
  ];
  return rows.filter((row) => row !== null);
}

// Two sections side by side from lg up.
const PAIR = "grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** CafeOrCoffeeShop structured data (INFO-02); no street address. */
function structuredData(cafe: CafeDetails, hours: Hours) {
  const amenity = (name: string, value: boolean | null) =>
    value === null
      ? null
      : { "@type": "LocationFeatureSpecification", name, value };
  const data = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: "Hoshikopi",
    description: cafe.spaceMd,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/cafe`,
    email: cafe.contactEmail,
    servesCuisine: "Coffee",
    address: {
      "@type": "PostalAddress",
      addressLocality: cafe.area,
      addressRegion: "Metro Manila",
      addressCountry: "PH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: cafe.mapLat,
      longitude: cafe.mapLng,
    },
    hasMap: mapsUrl(cafe),
    smokingAllowed: cafe.smokingAllowed ?? undefined,
    acceptsReservations: false,
    openingHoursSpecification: hours.weekly
      .filter((d) => !d.isClosed)
      .map((d) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAY_NAMES[d.weekday]}`,
        opens: d.opensAt,
        closes: d.closesAt,
      })),
    specialOpeningHoursSpecification: hours.special.map((s) => ({
      "@type": "OpeningHoursSpecification",
      validFrom: s.day,
      validThrough: s.day,
      opens: s.isClosed ? "00:00" : s.opensAt,
      closes: s.isClosed ? "00:00" : s.closesAt,
    })),
    amenityFeature: [
      amenity("Wi-Fi", cafe.wifi),
      amenity("Power outlets", cafe.powerOutlets),
      amenity("Pets allowed", cafe.petsAllowed),
      amenity("Restroom", cafe.restroom),
      amenity("Step-free entrance", cafe.stepFreeEntrance),
      amenity("Accessible restroom", cafe.accessibleRestroom),
    ].filter(Boolean),
  };
  // Escape "<" so the JSON cannot close the script element.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function CafePage() {
  const [cafe, hours, weekly] = await Promise.all([
    getCafeDetails(),
    getHours(),
    getRecurringEvents(),
  ]);
  const [hero, ...more] = ROOM_PHOTOS;
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData(cafe, hours) }}
      />
      <PageHeader
        title="Visit Hoshikopi"
        intro={
          <>
            {cafe.area}. <OpenStatus hours={hours} fallback="Open every day." />
          </>
        }
      />

      <section aria-labelledby="space" className="mt-10">
        <h2 id="space" className="sr-only">
          The space
        </h2>
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <RoomPhoto photo={hero} large />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            {more.slice(0, 2).map((photo) => (
              <RoomPhoto key={photo.name} photo={photo} />
            ))}
          </div>
        </div>
        <div className="mt-6 text-lg">
          <Markdown>{cafe.spaceMd}</Markdown>
        </div>
        <div className="mt-4">
          <PickupLine />
        </div>
      </section>

      <div className={`mt-14 ${PAIR}`}>
        <section aria-labelledby="hours">
          <h2 id="hours" className="font-display pb-1 text-3xl italic">
            Hours
          </h2>
          <div className="mt-4">
            <HoursList hours={hours} />
          </div>
        </section>
        <section aria-labelledby="getting-here">
          <h2 id="getting-here" className="font-display pb-1 text-3xl italic">
            Getting here
          </h2>
          <div className="mt-4 grid gap-4">
            <Markdown>{cafe.directionsMd}</Markdown>
            <p className="flex flex-wrap gap-x-6 gap-y-2">
              <a
                href={mapsUrl(cafe)}
                className="inline-flex items-center gap-2"
              >
                <MapPinIcon aria-hidden size={20} />
                Open in Maps
              </a>
              <a
                href={`mailto:${cafe.contactEmail}`}
                className="inline-flex items-center gap-2"
              >
                <EnvelopeIcon aria-hidden size={20} />
                {cafe.contactEmail}
              </a>
            </p>
          </div>
        </section>
      </div>

      <section aria-labelledby="good-to-know" className="mt-14">
        <h2 id="good-to-know" className="font-display pb-1 text-3xl italic">
          Good to know
        </h2>
        <div className="mt-5">
          <AmenityList amenities={cafe} />
        </div>
      </section>

      <div className={`mt-14 ${PAIR}`}>
        <WeeklyList events={weekly} className="max-w-measure" />
        <Panel
          id="private-events"
          title="Private events and big orders"
          icon={<CalendarStarIcon size={20} />}
        >
          <p className="max-w-measure">
            A party, a team meeting or more than a dozen drinks? Tell us a day
            ahead and the cafe will email you back.
          </p>
          <p className="mt-5 flex flex-wrap gap-3">
            <Link href="/cafe/inquire" className={OUTLINE_PILL}>
              Send us an inquiry
            </Link>
            <Link
              href="/cafe/inquire?kind=large_order"
              className={OUTLINE_PILL}
            >
              Big order (more than a dozen drinks)
            </Link>
          </p>
        </Panel>
      </div>

      <div className={`mt-14 ${PAIR}`}>
        <section aria-labelledby="questions" className="max-w-measure">
          <h2 id="questions" className="font-display pb-1 text-3xl italic">
            Questions
          </h2>
          <div className="border-border mt-4 border-t">
            {faq(cafe).map(([question, answer]) => (
              <details key={question} className="border-border group border-b">
                <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 py-3 font-semibold">
                  {question}
                  <span
                    aria-hidden
                    className="text-xl transition-transform group-open:rotate-45 motion-reduce:transition-none"
                  >
                    +
                  </span>
                </summary>
                <p className="text-muted-foreground pb-4">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="story">
          <h2 id="story" className="font-display pb-1 text-3xl italic">
            Our story
          </h2>
          <div className="mt-4">
            <Markdown>{cafe.storyMd}</Markdown>
          </div>
          <p className="text-muted-foreground mt-4 font-mono text-sm">
            Concept: the story, the people and the room are invented.
          </p>
        </section>
      </div>

      <p className="border-border mt-14 flex flex-wrap gap-3 border-t pt-8">
        <Link href="/menu" className={PRIMARY_PILL}>
          Order ahead
          <ArrowRightIcon aria-hidden size={18} />
        </Link>
        <a href={mapsUrl(cafe)} className={OUTLINE_PILL}>
          <MapPinIcon aria-hidden size={18} />
          Get directions
        </a>
      </p>
    </main>
  );
}

function RoomPhoto({
  photo,
  large = false,
}: {
  photo: (typeof ROOM_PHOTOS)[number];
  large?: boolean;
}) {
  return (
    <figure className="grid gap-2 md:grid-rows-[minmax(0,1fr)_auto]">
      <Photo
        src={photo.src}
        alt={photo.alt}
        kind="room"
        sizes={
          large
            ? "(min-width: 768px) 66vw, 100vw"
            : "(min-width: 768px) 33vw, 100vw"
        }
        priority={large}
        className={`rounded-card ${large ? "aspect-4/3" : "aspect-4/3 md:aspect-auto md:h-full"}`}
      />
      <figcaption className="text-muted-foreground font-mono text-xs">
        {photo.caption}
      </figcaption>
    </figure>
  );
}
