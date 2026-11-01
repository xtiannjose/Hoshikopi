import Link from "next/link";

import { Photo, type PhotoKind } from "@/components/photo";
import { formatPrice } from "@/lib/money";
import type { MenuItemCard } from "@/modules/menu";

import { Badges } from "./badges";

/** A Menu Item on /menu: photo, name, one line, price, badges. */
export function MenuCard({
  item,
  headingLevel = 3,
}: {
  item: MenuItemCard;
  headingLevel?: 2 | 3 | 4;
}) {
  const Heading = `h${headingLevel}` as const;
  // What the menu's search and dietary filters read (MENU-05).
  const tags = [
    item.badges.includes("Vegan") && "vegan",
    item.badges.includes("No caffeine") && "no-caffeine",
    !item.badges.includes("Contains nuts") && "nut-free",
  ].filter(Boolean);
  return (
    <article
      data-menu-item=""
      data-search={`${item.name} ${item.description}`.toLowerCase()}
      data-tags={tags.join(" ")}
      className="group relative grid content-start gap-3"
    >
      <Photo
        src={item.photoUrl}
        alt={item.photoAlt}
        kind={item.categorySlug as PhotoKind}
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
        className={`rounded-card aspect-4/3 ${item.soldOut ? "opacity-50 grayscale" : ""}`}
      />
      <div className="flex items-baseline justify-between gap-3">
        <Heading className="text-lg font-semibold">
          <Link
            href={`/menu/item/${item.slug}`}
            className="no-underline group-hover:underline after:absolute after:inset-0"
          >
            {item.name}
          </Link>
        </Heading>
        <p className="shrink-0 font-mono">
          {item.soldOut ? (
            <span className="text-muted-foreground">Sold out today</span>
          ) : (
            formatPrice(item.baseCents)
          )}
        </p>
      </div>
      <p className="text-muted-foreground line-clamp-2">{item.description}</p>
      <Badges labels={item.badges} picks={item.picks} />
    </article>
  );
}
