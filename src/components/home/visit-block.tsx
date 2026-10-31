import Link from "next/link";
import { EnvelopeIcon, MapPinIcon } from "@phosphor-icons/react/ssr";

import { amenityRows } from "@/components/cafe/amenity-list";
import { HoursList } from "@/components/cafe/hours-list";
import { mapsUrl } from "@/components/cafe/maps";
import { OpenStatus } from "@/components/cafe/open-status";
import { Photo } from "@/components/photo";
import { PickupLine } from "@/components/pickup-line";
import type { Hours } from "@/lib/hours";
import type { CafeDetails, RoomPhoto } from "@/modules/cafe";

/** Where and when, at the end of Home (INFO-08). */
export function VisitBlock({
  cafe,
  hours,
  photo,
}: {
  cafe: CafeDetails;
  hours: Hours;
  photo: RoomPhoto;
}) {
  return (
    <section
      aria-labelledby="visit-us"
      id="visit"
      className="grid gap-10 lg:grid-cols-2 lg:gap-16"
    >
      <div className="grid content-start gap-5">
        <h2 id="visit-us" className="font-display pb-1 text-4xl italic">
          Visit us
        </h2>
        <p className="text-lg">
          <OpenStatus hours={hours} fallback="Open every day." />
        </p>
        <HoursList hours={hours} />
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <span className="inline-flex items-center gap-2">
            <MapPinIcon aria-hidden size={20} />
            {cafe.area}
          </span>
          <a href={mapsUrl(cafe)}>Get directions</a>
        </p>
        <p className="inline-flex items-center gap-2">
          <EnvelopeIcon aria-hidden size={20} />
          <a href={`mailto:${cafe.contactEmail}`}>{cafe.contactEmail}</a>
        </p>
        <PickupLine />
        <ul className="flex flex-wrap gap-2" aria-label="Good to know">
          {amenityRows(cafe)
            .slice(0, 5)
            .map(({ label }) => (
              <li
                key={label}
                className="border-border rounded-full border px-3 py-1 text-sm"
              >
                {label}
              </li>
            ))}
        </ul>
        <p>
          <Link href="/cafe" className="font-semibold">
            Everything about visiting
          </Link>
        </p>
      </div>
      <figure className="grid content-start gap-2">
        <Photo
          src={photo.src}
          alt={photo.alt}
          kind="room"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="rounded-card aspect-4/3"
        />
        <figcaption className="text-muted-foreground font-mono text-xs">
          {photo.caption}
        </figcaption>
      </figure>
    </section>
  );
}
