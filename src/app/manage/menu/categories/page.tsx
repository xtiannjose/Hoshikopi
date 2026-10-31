import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { requireStaff } from "@/modules/identity";
import { getMenuForStaff } from "@/modules/menu";

import { CategoryForm } from "./category-form";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage/menu">Back to the menu</Link>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">Categories</h1>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <Forms />
      </Suspense>
    </main>
  );
}

async function Forms() {
  await requireStaff("manager", "/manage/menu/categories");
  const { categories } = await getMenuForStaff();
  return (
    <div className="mt-6 grid gap-6">
      {categories.map((category) => (
        <CategoryForm key={category.id} category={category} />
      ))}
      <h2 className="font-display text-2xl italic">Add a Category</h2>
      <CategoryForm
        category={{
          id: null,
          name: "",
          slug: "",
          isHidden: false,
          sort: categories.length,
        }}
      />
    </div>
  );
}
