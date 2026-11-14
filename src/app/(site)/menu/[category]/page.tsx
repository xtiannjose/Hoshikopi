import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";

import { Breadcrumb } from "@/components/breadcrumb";
import { CategoryTabs } from "@/components/menu/category-tabs";
import { MenuGrid } from "@/components/menu/menu-section";
import { PageHeader } from "@/components/page-header";
import { OUTLINE_PILL } from "@/components/panel";
import { PickupLine } from "@/components/pickup-line";
import { getMenu, menuSlugs } from "@/modules/menu";

export async function generateStaticParams() {
  const { categories } = await menuSlugs();
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: PageProps<"/menu/[category]">): Promise<Metadata> {
  const { category } = await params;
  const found = (await getMenu()).find((c) => c.slug === category);
  return found ? { title: `${found.name} menu` } : { title: "Page not found" };
}

// params are read inside Suspense (see the Menu Item page).
export default function CategoryPage({
  params,
}: PageProps<"/menu/[category]">) {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <Suspense fallback={<div className="min-h-96" />}>
        <Category params={params} />
      </Suspense>
    </main>
  );
}

async function Category({
  params,
}: Pick<PageProps<"/menu/[category]">, "params">) {
  const { category: slug } = await params;
  const menu = await getMenu();
  const index = menu.findIndex((c) => c.slug === slug);
  if (index === -1) notFound();
  const category = menu[index];
  // The last Category wraps round to the first.
  const next = menu[(index + 1) % menu.length];
  return (
    <>
      <PageHeader
        back={
          <Breadcrumb
            items={[{ label: "Menu", href: "/menu" }, { label: category.name }]}
          />
        }
        title={category.name}
      />
      <div className="mt-3">
        <PickupLine />
      </div>
      <CategoryTabs categories={menu} current={slug} className="mt-4" />
      <MenuGrid items={category.items} headingLevel={2} />
      <nav
        aria-label="More of the menu"
        className="border-border mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6"
      >
        {next !== category && (
          <Link href={`/menu/${next.slug}`} className={OUTLINE_PILL}>
            Next up: {next.name}
            <ArrowRightIcon aria-hidden size={18} />
          </Link>
        )}
        <Link
          href="/menu"
          className="inline-flex min-h-11 items-center no-underline hover:underline"
        >
          See the whole menu
        </Link>
      </nav>
    </>
  );
}
