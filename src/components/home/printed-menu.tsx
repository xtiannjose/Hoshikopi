import Link from "next/link";

import { MenuSection } from "@/components/menu/menu-section";
import { VIEW_THREAD, ViewChoice } from "@/components/view-choice";
import { formatDelta, formatPrice } from "@/lib/money";
import type { MenuCategory } from "@/modules/menu";

/**
 * The Home menu: a printed list by default, photo cards on request. The
 * View switch is two native radios; CSS shows one view (no JavaScript).
 */
export function PrintedMenu({
  menu,
  priced,
}: {
  menu: MenuCategory[];
  priced: { name: string; deltaCents: number }[];
}) {
  return (
    <section aria-labelledby="the-menu" id="menu" className="group/view">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="the-menu" className="font-display pb-1 text-4xl italic">
            The menu
          </h2>
          <p className="text-muted-foreground mt-2 max-w-[50ch]">
            Coffee, tea and merienda, made to order. Tap a drink to choose its
            size, milk and sugar.
          </p>
        </div>
        <fieldset className="flex flex-wrap items-center gap-3">
          <legend className="sr-only">View</legend>
          <ViewChoice id="view-list" label="List" defaultChecked />
          {VIEW_THREAD}
          <ViewChoice id="view-photos" label="Photos" />
        </fieldset>
      </div>

      {/* CSS columns pack the blocks like a printed menu, so no block sits
          alone in a last row (audit UI2-21). */}
      <div className="mt-10 gap-x-12 group-has-[#view-photos:checked]/view:hidden md:columns-2 xl:columns-3 2xl:columns-4">
        {menu.map((category) => (
          <div
            key={category.slug}
            className="mb-10 break-inside-avoid last:mb-0"
          >
            <h3 className="font-display pb-1 text-2xl italic">
              {category.name}
            </h3>
            <ul className="mt-3 grid gap-2">
              {category.items.map((item) => (
                <li key={item.slug} className="flex items-baseline gap-2">
                  <Link
                    href={`/menu/item/${item.slug}`}
                    className="no-underline hover:underline"
                  >
                    {item.name}
                  </Link>
                  <span
                    aria-hidden
                    className="border-border min-w-4 flex-1 border-b border-dotted"
                  />
                  <span className="font-mono text-sm">
                    {item.soldOut
                      ? "Sold out today"
                      : formatPrice(item.baseCents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {priced.length > 0 && (
          <div className="mb-10 break-inside-avoid last:mb-0">
            <h3 className="font-display pb-1 text-2xl italic">Make it yours</h3>
            <ul className="mt-3 grid gap-2">
              {priced.map((option) => (
                <li key={option.name} className="flex items-baseline gap-2">
                  {option.name}
                  <span
                    aria-hidden
                    className="border-border min-w-4 flex-1 border-b border-dotted"
                  />
                  <span className="font-mono text-sm">
                    {formatDelta(option.deltaCents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="hidden group-has-[#view-photos:checked]/view:block">
        {menu.map((category) => (
          <MenuSection
            key={category.slug}
            category={category}
            headingLevel={3}
          />
        ))}
      </div>
    </section>
  );
}
