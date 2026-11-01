import type { MenuCategory } from "@/modules/menu";

import { MenuCard } from "./menu-card";

export function MenuSection({
  category,
  headingLevel = 2,
}: {
  category: MenuCategory;
  headingLevel?: 1 | 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <section
      data-menu-section=""
      aria-labelledby={`cat-${category.slug}`}
      className="mt-12"
    >
      <Heading
        id={`cat-${category.slug}`}
        className="font-display pb-1 text-3xl italic md:text-4xl"
      >
        {category.name}
      </Heading>
      <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item) => (
          <MenuCard
            key={item.slug}
            item={item}
            headingLevel={(headingLevel + 1) as 2 | 3 | 4}
          />
        ))}
      </div>
    </section>
  );
}
