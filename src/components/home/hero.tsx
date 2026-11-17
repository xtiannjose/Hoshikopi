import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon, MapPinIcon } from "@phosphor-icons/react/ssr";

import { LastOrderNote } from "@/components/cafe/last-order-note";
import { ManilaClock } from "@/components/cafe/manila-clock";
import { mapsUrl } from "@/components/cafe/maps";
import { OpenStatus } from "@/components/cafe/open-status";
import { Photo } from "@/components/photo";
import type { Hours } from "@/lib/hours";
import type { CafeDetails, RoomPhoto } from "@/modules/cafe";

// Both lines are in the page; the palette shows one (INFO-12, ADR 0010).
// No time of day in either: a visitor who pins a palette sees it all day
// (audit UI1-15).
const COPY = {
  day: {
    title: "Your kopi, ready before you get here.",
    line: "Order ahead on your way in, pick up at the counter and earn a Star with every drink.",
  },
  night: {
    title: "Your kopi, ready when you are.",
    line: "Order ahead for a study session or a merienda with friends, pick up at the counter and earn a Star with every drink.",
  },
};

export function Hero({
  cafe,
  hours,
  photo,
  demo,
  pickup,
}: {
  cafe: CafeDetails;
  hours: Hours;
  photo: RoomPhoto;
  /** Demo Mode is on: point to the two-minute guide (audit journeys:20). */
  demo: boolean;
  /** The next Pickup Times, read at request time (audit UI2-05). */
  pickup: ReactNode;
}) {
  return (
    <section className="grid gap-10 pt-6 lg:grid-cols-[7fr_5fr] lg:gap-16 lg:pt-10">
      <div>
        <h1 className="font-display pb-1 text-5xl leading-[1.1] text-balance italic md:text-6xl xl:text-7xl">
          <span className="night:hidden">{COPY.day.title}</span>
          <span className="night:inline hidden">{COPY.night.title}</span>
        </h1>
        <p className="text-muted-foreground mt-6 max-w-[42ch] text-lg">
          <span className="night:hidden">{COPY.day.line}</span>
          <span className="night:inline hidden">{COPY.night.line}</span>
        </p>
        <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            href="/menu"
            className="bg-primary text-primary-foreground inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 text-lg font-semibold no-underline"
          >
            Order ahead
            <ArrowRightIcon aria-hidden size={20} />
          </Link>
          <Link
            href="#visit"
            className="border-input inline-flex min-h-14 items-center justify-center rounded-full border px-8 text-lg font-semibold no-underline"
          >
            Plan your visit
          </Link>
        </div>
        {demo && (
          <p className="mt-4 text-sm">
            A demo you can try on your own, playing the barista too.{" "}
            <Link href="/concept#try">See how in two minutes</Link>
          </p>
        )}
        <div className="border-input bg-muted rounded-card mt-8 grid gap-2 border border-dashed p-5">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon aria-hidden size={18} />
              {cafe.area}
            </span>
            <a href={mapsUrl(cafe)}>Directions</a>
          </p>
          <p className="flex flex-wrap items-baseline gap-x-3">
            <ManilaClock />
            <OpenStatus hours={hours} fallback="Open every day." />
          </p>
          <LastOrderNote hours={hours} />
          {pickup}
        </div>
      </div>
      <figure className="grid content-start gap-2">
        <Photo
          src={photo.src}
          alt={photo.alt}
          kind="room"
          sizes="(min-width: 1024px) 40vw, 100vw"
          priority
          className="rounded-card aspect-4/5 lg:aspect-auto lg:min-h-[28rem]"
        />
        {/* Only a shown photo gets a caption (ADR 0012, audit UI2-02). */}
        {photo.src && (
          <figcaption className="text-muted-foreground font-mono text-sm">
            {photo.caption}
          </figcaption>
        )}
      </figure>
    </section>
  );
}
