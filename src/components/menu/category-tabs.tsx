import Link from "next/link";

import type { MenuCategory } from "@/modules/menu";

/** Category links; scrolls sideways on a phone. */
export function CategoryTabs({
  categories,
  current,
}: {
  categories: MenuCategory[];
  current?: string;
}) {
  return (
    <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex w-max gap-2 py-1">
        <li>
          <Tab href="/menu" label="Everything" current={!current} />
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Tab
              href={`/menu/${category.slug}`}
              label={category.name}
              current={current === category.slug}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Tab({
  href,
  label,
  current,
}: {
  href: string;
  label: string;
  current: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className="border-input aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:border-primary inline-flex min-h-11 items-center rounded-full border px-4 whitespace-nowrap no-underline"
    >
      {label}
    </Link>
  );
}
