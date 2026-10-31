import Link from "next/link";

import { MenuSection } from "@/components/menu/menu-section";
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
        <fieldset className="flex items-center gap-3">
          <legend className="sr-only">View</legend>
          <ViewChoice id="view-list" label="List" defaultChecked />
          <span
            aria-hidden
            className="border-input w-10 border-t border-dashed"
          />
          <ViewChoice id="view-photos" label="Photos" />
        </fieldset>
      </div>

      <div className="mt-10 grid gap-x-12 gap-y-10 group-has-[#view-photos:checked]/view:hidden md:grid-cols-2 xl:grid-cols-3">
        {menu.map((category) => (
          <div key={category.slug}>
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
          <div>
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

/** A ring on the dashed thread that turns into the gold star when picked. */
function ViewChoice({
  id,
  label,
  defaultChecked = false,
}: {
  id: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="group/choice has-[:focus-visible]:outline-ring text-muted-foreground has-[:checked]:text-foreground inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full pr-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
    >
      <input
        id={id}
        type="radio"
        name="menu-view"
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      <span className="bg-muted relative grid size-7 place-items-center rounded-full">
        <span className="border-input size-3 rounded-full border-[1.5px] transition-transform group-has-[:checked]/choice:scale-0 motion-reduce:transition-none" />
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="absolute size-5 scale-0 transition-transform group-has-[:checked]/choice:scale-100 motion-reduce:transition-none"
        >
          <path
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
            className="fill-star stroke-star-edge"
            strokeWidth="1"
          />
        </svg>
      </span>
      <span className="font-display text-lg italic">{label}</span>
    </label>
  );
}
