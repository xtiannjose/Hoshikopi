import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryTabs } from "@/components/menu/category-tabs";
import { MenuSection } from "@/components/menu/menu-section";
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
  return found ? { title: `${found.name} menu` } : {};
}

// params are read inside Suspense (see the Menu Item page).
export default function CategoryPage({
  params,
}: PageProps<"/menu/[category]">) {
  return (
    <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 md:px-8">
      <p className="text-muted-foreground pt-8 font-mono text-sm">Menu</p>
      <div className="mt-3">
        <PickupLine />
      </div>
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
  const category = menu.find((c) => c.slug === slug);
  if (!category) notFound();
  return (
    <>
      <div className="mt-6">
        <CategoryTabs categories={menu} current={slug} />
      </div>
      <MenuSection category={category} headingLevel={1} />
    </>
  );
}
