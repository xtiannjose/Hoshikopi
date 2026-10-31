import Image from "next/image";
import {
  BowlFoodIcon,
  BreadIcon,
  CoffeeIcon,
  LeafIcon,
  OrangeSliceIcon,
  PackageIcon,
  StorefrontIcon,
} from "@phosphor-icons/react/ssr";

const ICONS = {
  coffee: CoffeeIcon,
  "non-coffee": OrangeSliceIcon,
  tea: LeafIcon,
  pastries: BreadIcon,
  "all-day-food": BowlFoodIcon,
  "beans-and-merch": PackageIcon,
  room: StorefrontIcon,
} as const;

export type PhotoKind = keyof typeof ICONS;

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
  kind: PhotoKind;
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
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }
  const Icon = ICONS[kind];
  return (
    <div
      aria-hidden
      className={`bg-muted text-input grid place-items-center ${className}`}
    >
      <Icon size={48} weight="thin" />
    </div>
  );
}
