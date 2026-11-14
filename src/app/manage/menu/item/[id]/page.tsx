import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { OUTLINE_PILL, Pill } from "@/components/panel";
import { Photo } from "@/components/photo";
import { formatDate, manila, now } from "@/lib/clock";
import { formatReceipt } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { getMenuForStaff, getMenuItemForEdit } from "@/modules/menu";

import { ItemForm, type ItemFormData } from "./item-form";

export const metadata: Metadata = { title: "Menu Item" };

const back = <BackLink href="/manage/menu">Menu</BackLink>;

export default function ManageItemPage({
  params,
  searchParams,
}: PageProps<"/manage/menu/item/[id]">) {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <Suspense
        fallback={
          <>
            {back}
            <p className="mt-4">Loading...</p>
          </>
        }
      >
        <Editor params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const day = (at: Date | null) => at?.toISOString().slice(0, 10);

async function Editor({
  params,
  searchParams,
}: Pick<PageProps<"/manage/menu/item/[id]">, "params" | "searchParams">) {
  await requireStaff("manager", "/manage/menu");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { categories, optionGroups } = await getMenuForStaff();
  const menuItems = categories.flatMap((category) => category.items);

  if (id === "new") {
    const preset = categories.find((c) => c.id === query.category);
    const item: ItemFormData = {
      id: null,
      categoryId: preset?.id ?? categories[0]?.id ?? "",
      name: "",
      slug: "",
      description: "",
      basePrice: "",
      isDrink: true,
      isHidden: false,
      badges: [],
      allergens: [],
      optionGroupIds: [],
      pairingId: "",
      calories: "",
      promoPrice: "",
      promoFrom: "",
      promoUntil: "",
      availableUntil: "",
      photoUrl: null,
      photoAlt: "",
      sort: 0,
    };
    return (
      <>
        <PageHeader size="staff" back={back} title="Add a Menu Item" />
        <div className="mt-8">
          <ItemForm
            item={item}
            categories={categories}
            optionGroups={optionGroups}
            menuItems={menuItems}
          />
        </div>
      </>
    );
  }

  const row = await getMenuItemForEdit(id);
  if (!row) notFound();
  const item: ItemFormData = {
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
    pairingId: row.pairingId ?? "",
    calories: row.calorieKcal?.toString() ?? "",
    promoPrice: row.promoCents === null ? "" : formatReceipt(row.promoCents),
    promoFrom: day(row.promoFrom) ?? "",
    promoUntil: day(row.promoUntil) ?? "",
    availableUntil: day(row.availableUntil) ?? "",
    photoUrl: row.photoUrl,
    photoAlt: row.photoAlt ?? "",
    sort: row.sort,
  };

  // Dates still to come; a promo or season that ended says nothing.
  const today = manila(now()).day;
  const ahead = (at: Date | null) =>
    at && at.toISOString().slice(0, 10) >= today ? formatDate(at) : null;
  const promoUntil = row.promoCents === null ? null : ahead(row.promoUntil);
  const availableUntil = ahead(row.availableUntil);
  const soldOut = menuItems.find((m) => m.id === row.id)?.soldOut ?? false;
  const pills = (soldOut || row.isHidden || promoUntil || availableUntil) && (
    <span className="flex flex-wrap items-center gap-2">
      {soldOut && <Pill tone="warning">Sold out today</Pill>}
      {row.isHidden && <Pill tone="muted">Hidden</Pill>}
      {promoUntil && <Pill>Promo until {promoUntil}</Pill>}
      {availableUntil && <Pill>On the menu until {availableUntil}</Pill>}
    </span>
  );

  const slug = categories.find((c) => c.id === row.categoryId)?.slug ?? "";
  const photo = (
    <Photo
      src={row.photoUrl}
      alt={row.photoAlt ?? ""}
      kind={slug}
      sizes="20rem"
      className="rounded-card aspect-[4/3] w-full max-w-80"
    />
  );

  return (
    <>
      <PageHeader
        size="staff"
        back={back}
        title={row.name}
        actions={
          <>
            {pills && <span className="xl:hidden">{pills}</span>}
            {!row.isHidden && (
              <Link href={`/menu/item/${row.slug}`} className={OUTLINE_PILL}>
                See it on the site
              </Link>
            )}
          </>
        }
      />
      {query.added === "1" && (
        <p className="bg-muted rounded-card mt-6 flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 p-4">
          <CheckCircleIcon aria-hidden size={20} className="text-success" />
          {row.isHidden
            ? "Added. It's hidden for now; untick Hidden when it's ready."
            : "Added. It's on the menu now."}
          <Link href="/manage/menu/item/new" className="font-semibold">
            Add another
          </Link>
        </p>
      )}
      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,48rem)_minmax(0,1fr)] xl:items-start">
        <ItemForm
          item={item}
          categories={categories}
          optionGroups={optionGroups}
          menuItems={menuItems}
          photo={photo}
        />
        <aside
          aria-label="At a glance"
          className="hidden gap-4 xl:sticky xl:top-6 xl:grid"
        >
          {photo}
          {pills}
        </aside>
      </div>
    </>
  );
}
