import Link from "next/link";

import { formatPrice } from "@/lib/money";
import type { MenuItemCard } from "@/modules/menu";

/**
 * Popular this week (MENU-09): the most ordered drinks from real Orders,
 * labelled as demo data; absent until there are enough Orders.
 */
export function PopularThisWeek({ items }: { items: MenuItemCard[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="popular" className="mt-24">
      <h2 id="popular" className="font-display pb-1 text-4xl italic">
        Popular this week
      </h2>
      <p className="text-muted-foreground mt-2">
        From this week&apos;s orders on this demo.
      </p>
      <ol className="border-border mt-6 border-t">
        {items.map((item, index) => (
          <li
            key={item.slug}
            className="border-border flex items-baseline gap-4 border-b py-3"
          >
            <span aria-hidden className="text-muted-foreground font-mono">
              {index + 1}
            </span>
            <Link
              href={`/menu/item/${item.slug}`}
              className="flex-1 font-semibold"
            >
              {item.name}
            </Link>
            <span className="font-mono">
              {item.soldOut ? "Sold out today" : formatPrice(item.baseCents)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
