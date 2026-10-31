import Link from "next/link";
import { ArrowRightIcon, MapPinIcon } from "@phosphor-icons/react/ssr";

import { ManilaClock } from "@/components/cafe/manila-clock";
import { mapsUrl } from "@/components/cafe/maps";
import { OpenStatus } from "@/components/cafe/open-status";
import { Photo } from "@/components/photo";
import type { Hours } from "@/lib/hours";
import type { CafeDetails, RoomPhoto } from "@/modules/cafe";

// Both lines are in the page; the palette shows one (INFO-12, ADR 0010).
const COPY = {
  day: {
    title: "Your morning kopi, ready before you get here.",
    line: "Magandang umaga! Order ahead on your way in, pick up at the counter and earn a Star with every drink.",
  },
  night: {
    title: "Your evening kopi, ready before you get here.",
    line: "Order ahead for a study night or a late merienda, pick up at the counter and earn a Star with every drink.",
  },
};

export function Hero({
  cafe,
  hours,
  photo,
}: {
  cafe: CafeDetails;
  hours: Hours;
  photo: RoomPhoto;
}) {
  return (
    <section className="grid gap-10 pt-6 lg:grid-cols-[7fr_5fr] lg:gap-16 lg:pt-10">
      <div>
        <h1 className="font-display pb-1 text-5xl leading-[1.1] italic md:text-6xl xl:text-7xl">
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
            className="bg-primary text-primary-foreground inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 text-lg font-semibold no-underline transition-transform active:scale-[0.98]"
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
        <figcaption className="text-muted-foreground font-mono text-xs">
          {photo.caption}
        </figcaption>
      </figure>
    </section>
  );
}
