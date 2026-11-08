import type { Metadata } from "next";
import { Suspense } from "react";
import { PlusIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { requireStaff } from "@/modules/identity";
import { getMenuForStaff } from "@/modules/menu";

import { CategoryForm } from "./category-form";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <PageHeader
        size="staff"
        back={<BackLink href="/manage/menu">Menu</BackLink>}
        title="Categories"
      />
      <Suspense fallback={<p className="mt-8">Loading...</p>}>
        <Forms />
      </Suspense>
    </main>
  );
}

async function Forms() {
  await requireStaff("manager", "/manage/menu/categories");
  const { categories } = await getMenuForStaff();
  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
      <div className="grid gap-6">
        {categories.map((category) => (
          <CategoryForm
            key={category.id}
            category={category}
            items={category.items.length}
          />
        ))}
      </div>
      <Panel
        id="add-category"
        title="Add a Category"
        icon={<PlusIcon size={20} />}
        className="xl:sticky xl:top-6"
      >
        <CategoryForm
          category={{
            id: null,
            name: "",
            slug: "",
            isHidden: false,
            sort: categories.length,
          }}
        />
      </Panel>
    </div>
  );
}
