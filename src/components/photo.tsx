import Image from "next/image";
import { createElement } from "react";
import {
  BowlFoodIcon,
  BreadIcon,
  CoffeeIcon,
  DropIcon,
  ForkKnifeIcon,
  LeafIcon,
  MicrophoneStageIcon,
  NewspaperIcon,
  PackageIcon,
  StorefrontIcon,
} from "@phosphor-icons/react/ssr";

export const ICONS = {
  coffee: CoffeeIcon,
  // A neutral drink, not a fruit (audit UI2-23).
  "non-coffee": DropIcon,
  tea: LeafIcon,
  pastries: BreadIcon,
  "all-day-food": BowlFoodIcon,
  "beans-and-merch": PackageIcon,
  room: StorefrontIcon,
  event: MicrophoneStageIcon,
  post: NewspaperIcon,
} as const;

/**
 * The stand-in icon for a kind: a Category slug, or room, event or post.
 * Managers can add Categories with any slug, so an unknown one (or one
 * like "constructor") gets the plain fork and knife instead of crashing.
 */
export function iconFor(kind: string) {
  return Object.hasOwn(ICONS, kind)
    ? ICONS[kind as keyof typeof ICONS]
    : ForkKnifeIcon;
}

/**
 * A concept image, or until it exists a calm stand-in panel (ADR 0012).
 * The stand-in is decorative: it never claims to be the photo.
 */
export function Photo({
  src,
  alt,
  kind,
  sizes,
  priority = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  kind: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          // Next 16 deprecates `priority`; its guide prefers these for the
          // image that is the page's largest paint (audit PERF-18).
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={`bg-muted text-input grid place-items-center ${className}`}
    >
      {createElement(iconFor(kind), { size: 48, weight: "thin" })}
    </div>
  );
}
