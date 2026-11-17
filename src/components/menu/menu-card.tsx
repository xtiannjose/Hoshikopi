import Link from "next/link";

import { Photo } from "@/components/photo";
import type { MenuItemCard } from "@/modules/menu";

import { Badges } from "./badges";
import { Price } from "./price";

/** A Menu Item on /menu: photo, name, one line, price, badges. A row on a
 * phone (small square photo beside the text), a card from sm up. */
export function MenuCard({
  item,
  headingLevel = 3,
}: {
  item: MenuItemCard;
  headingLevel?: 2 | 3 | 4;
}) {
  const Heading = `h${headingLevel}` as const;
  // data-search and data-tags are what the menu's search and dietary
  // filters read (MENU-05).
  return (
    <article
      data-menu-item=""
      data-search={`${item.name} ${item.description}`.toLowerCase()}
      data-tags={item.tags.join(" ")}
      className="group lift reveal relative grid grid-cols-[6rem_minmax(0,1fr)] content-start gap-x-4 gap-y-1.5 sm:grid-cols-1 sm:gap-3"
    >
      <Photo
        src={item.photoUrl}
        alt={item.photoAlt}
        kind={item.categorySlug}
        sizes="(min-width: 1536px) 18rem, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 6rem"
        className={`rounded-card row-span-3 aspect-square self-start sm:row-span-1 sm:aspect-4/3 ${item.soldOut ? "opacity-50 grayscale" : ""}`}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <Heading className="text-lg font-semibold">
          <Link
            href={`/menu/item/${item.slug}`}
            className="no-underline group-hover:underline after:absolute after:inset-0"
          >
            {item.name}
          </Link>
        </Heading>
        <p className="font-mono">
          {item.soldOut ? (
            <span className="text-muted-foreground">Sold out today</span>
          ) : (
            <Price cents={item.baseCents} regularCents={item.regularCents} />
          )}
        </p>
      </div>
      <p className="text-muted-foreground line-clamp-2">{item.description}</p>
      <Badges labels={item.badges} picks={item.picks} />
    </article>
  );
}
