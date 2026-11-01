import Link from "next/link";

import { Photo, type PhotoKind } from "@/components/photo";
import { formatPrice } from "@/lib/money";
import type { MenuItemCard } from "@/modules/menu";

const COPY = {
  day: { heading: "Barista picks this week", note: "New picks every Monday." },
  night: {
    heading: "Barista picks for tonight",
    note: "What we pour after 6 PM.",
  },
};

/**
 * Barista picks: one large, two small (INFO-08). One set per palette, shown
 * only in its own (INFO-13); the page stays prerendered, so CSS chooses.
 */
export function BaristaPicks({
  picks,
  palette,
}: {
  picks: MenuItemCard[];
  palette: "day" | "night";
}) {
  if (picks.length === 0) return null;
  const id = `picks-${palette}`;
  return (
    <section
      aria-labelledby={id}
      className={palette === "day" ? "night:hidden" : "night:block hidden"}
    >
      <h2 id={id} className="font-display pb-1 text-4xl italic">
        {COPY[palette].heading}
      </h2>
      <p className="text-muted-foreground mt-2">{COPY[palette].note}</p>
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
