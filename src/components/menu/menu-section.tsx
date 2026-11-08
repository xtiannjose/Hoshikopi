import type { MenuCategory, MenuItemCard } from "@/modules/menu";

import { MenuCard } from "./menu-card";

/** Menu Item cards: a compact row each on a phone, then 2 to 5 columns. */
export function MenuGrid({
  items,
  headingLevel,
}: {
  items: MenuItemCard[];
  headingLevel: 2 | 3 | 4;
}) {
  return (
    <div className="mt-6 grid gap-x-6 gap-y-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((item) => (
        <MenuCard key={item.slug} item={item} headingLevel={headingLevel} />
      ))}
    </div>
  );
}

export function MenuSection({
  category,
  headingLevel = 2,
}: {
  category: MenuCategory;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <section
      data-menu-section=""
      aria-labelledby={`cat-${category.slug}`}
      className="mt-12"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <Heading
          id={`cat-${category.slug}`}
          className="font-display pb-1 text-3xl italic md:text-4xl"
        >
          {category.name}
        </Heading>
        <p className="text-muted-foreground font-mono text-sm">
          {category.items.length}{" "}
          {category.items.length === 1 ? "item" : "items"}
        </p>
      </div>
      <MenuGrid
        items={category.items}
        headingLevel={(headingLevel + 1) as 3 | 4}
      />
    </section>
  );
}
