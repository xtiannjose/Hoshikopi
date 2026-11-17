import Link from "next/link";

import { Photo } from "@/components/photo";
import { formatPrice } from "@/lib/money";
import type { MenuItemCard } from "@/modules/menu";

// No time of day in the heading or note: a pinned palette shows all day (audit UI1-15).
const COPY = {
  day: { heading: "Barista picks this week", note: "Chosen by our baristas." },
  night: {
    heading: "Barista picks to take it slow",
    note: "Slower cups for a long sit.",
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
            className={`reveal grid content-start ${index === 0 ? "gap-3 md:row-span-2" : "grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4"}`}
          >
            <Photo
              src={item.photoUrl}
              alt={item.photoAlt}
              kind={item.categorySlug}
              sizes={
                index === 0
                  ? "(min-width: 768px) 50vw, 100vw"
                  : "(min-width: 768px) 20vw, 40vw"
              }
              className={`rounded-card ${index === 0 ? "aspect-4/3 md:aspect-auto md:min-h-80" : "aspect-4/3"}`}
            />
            <div className="grid content-start gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
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
                {/* It opens the Menu Item to choose its Options (audit
                    UI2-24). */}
                Make it yours
                <span className="sr-only"> ({item.name})</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
