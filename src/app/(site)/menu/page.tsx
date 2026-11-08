import type { Metadata } from "next";

import { CategoryTabs } from "@/components/menu/category-tabs";
import { MenuFilter } from "@/components/menu/menu-filter";
import { MenuSection } from "@/components/menu/menu-section";
import { PageHeader } from "@/components/page-header";
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
    <main id="main" className="page-width flex-1 pt-8">
      <PageHeader
        title="Menu"
        intro={
          // Both lines are in the page; the palette shows one (ADR 0010).
          <>
            <span className="night:hidden">
              Kopi, tea and merienda, made to order.
            </span>
            <span className="night:inline hidden">
              A calm cup and a late merienda for the study night.
            </span>
          </>
        }
      />
      <div className="mt-3">
        <PickupLine />
      </div>
      <div className="mt-6">
        <MenuFilter />
      </div>
      <CategoryTabs categories={menu} className="mt-4" />
      {menu.map((category) => (
        <MenuSection key={category.slug} category={category} />
      ))}
    </main>
  );
}
