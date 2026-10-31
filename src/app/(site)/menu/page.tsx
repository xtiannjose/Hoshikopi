import type { Metadata } from "next";

import { CategoryTabs } from "@/components/menu/category-tabs";
import { MenuSection } from "@/components/menu/menu-section";
import { PickupLine } from "@/components/pickup-line";
import { getMenu } from "@/modules/menu";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Coffee, non-coffee, tea, pastries and all-day food at Hoshikopi. Order ahead for pickup.",
};

export default async function MenuPage() {
  const menu = await getMenu();
  return (
    <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 md:px-8">
      <h1 className="font-display pt-8 pb-1 text-5xl italic md:text-6xl">
        Menu
      </h1>
      <div className="mt-3">
        <PickupLine />
      </div>
      <div className="mt-6">
        <CategoryTabs categories={menu} />
      </div>
      {menu.map((category) => (
        <MenuSection key={category.slug} category={category} />
      ))}
    </main>
  );
}
