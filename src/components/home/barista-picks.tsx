import Link from "next/link";

import { Photo, type PhotoKind } from "@/components/photo";
import { formatPrice } from "@/lib/money";
import type { MenuItemCard } from "@/modules/menu";

/** "Barista picks this week": one large, two small (INFO-08). */
export function BaristaPicks({ picks }: { picks: MenuItemCard[] }) {
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby="picks">
      <h2 id="picks" className="font-display pb-1 text-4xl italic">
        Barista picks this week
      </h2>
      <p className="text-muted-foreground mt-2">New picks every Monday.</p>
      <div className="mt-8 grid gap-8 md:grid-cols-2 md:grid-rows-2">
        {picks.slice(0, 3).map((item, index) => (
          <article
            key={item.slug}
            className={`grid content-start gap-3 ${index === 0 ? "md:row-span-2" : "md:grid-cols-[2fr_3fr] md:gap-5"}`}
          >
            <Photo
              src={item.photoUrl}
              alt={item.photoAlt}
              kind={item.categorySlug as PhotoKind}
              sizes={
                index === 0
                  ? "(min-width: 768px) 50vw, 100vw"
                  : "(min-width: 768px) 20vw, 100vw"
              }
              className={`rounded-card ${index === 0 ? "aspect-4/3 md:aspect-auto md:min-h-80" : "aspect-4/3"}`}
            />
            <div className="grid content-start gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display pb-1 text-2xl italic">
                  {item.name}
                </h3>
                <span className="font-mono">
                  {item.soldOut
                    ? "Sold out today"
                    : formatPrice(item.baseCents)}
                </span>
              </div>
              <p className="text-muted-foreground">{item.description}</p>
              <Link
                href={`/menu/item/${item.slug}`}
                className="border-input mt-1 inline-flex min-h-11 w-fit items-center rounded-full border px-5 font-semibold no-underline"
              >
                Add to order
                <span className="sr-only"> ({item.name})</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
