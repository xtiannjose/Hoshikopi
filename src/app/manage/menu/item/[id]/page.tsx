import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { formatReceipt } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { getMenuForStaff, getMenuItemForEdit } from "@/modules/menu";

import { ItemForm, type ItemFormData } from "./item-form";

export const metadata: Metadata = { title: "Menu Item" };

export default function ManageItemPage({
  params,
}: PageProps<"/manage/menu/item/[id]">) {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage/menu">Back to the menu</Link>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <Editor params={params} />
      </Suspense>
    </main>
  );
}

async function Editor({
  params,
}: Pick<PageProps<"/manage/menu/item/[id]">, "params">) {
  await requireStaff("manager", "/manage/menu");
  const { id } = await params;
  const { categories, optionGroups } = await getMenuForStaff();
  let item: ItemFormData;
  if (id === "new") {
    item = {
      id: null,
      categoryId: categories[0]?.id ?? "",
      name: "",
      slug: "",
      description: "",
      basePrice: "",
      isDrink: true,
      isHidden: false,
      badges: [],
      allergens: [],
      optionGroupIds: [],
      photoUrl: null,
      photoAlt: "",
      sort: 0,
    };
  } else {
    const row = await getMenuItemForEdit(id);
    if (!row) notFound();
    item = {
      id: row.id,
      categoryId: row.categoryId,
      name: row.name,
      slug: row.slug,
      description: row.description,
      basePrice: formatReceipt(row.baseCents),
      isDrink: row.isDrink,
      isHidden: row.isHidden,
      badges: row.badges,
      allergens: row.allergens,
      optionGroupIds: row.optionGroups.map((g) => g.optionGroupId),
      photoUrl: row.photoUrl,
      photoAlt: row.photoAlt ?? "",
      sort: row.sort,
    };
  }
  return (
    <>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">
        {item.id ? item.name : "Add a Menu Item"}
      </h1>
      <ItemForm
        item={item}
        categories={categories}
        optionGroups={optionGroups}
      />
    </>
  );
}
