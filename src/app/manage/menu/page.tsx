import type { Metadata } from "next";
import Link from "next/link";
import { createElement, Suspense, type ReactNode } from "react";
import { PlusIcon, SlidersHorizontalIcon } from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import {
  Empty,
  OUTLINE_PILL,
  Panel,
  Pill,
  PRIMARY_PILL,
} from "@/components/panel";
import { iconFor, Photo } from "@/components/photo";
import { VIEW_THREAD, ViewChoice } from "@/components/view-choice";
import { formatDelta, formatPrice } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { getMenuForStaff } from "@/modules/menu";

import { SoldOutForm } from "../../bar/sold-out";

export const metadata: Metadata = { title: "Menu" };

const header = (actions?: ReactNode) => (
  <PageHeader
    size="staff"
    back={<BackLink href="/manage">Manage</BackLink>}
    title="Menu"
    intro="Ran out of something? Tap Sold out. It stays sold out for today only and comes back on by itself."
    actions={actions}
  />
);

export default function ManageMenuPage({
  searchParams,
}: PageProps<"/manage/menu">) {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <Suspense
        fallback={
          <>
            {header()}
            <p className="mt-8">Loading the menu...</p>
          </>
        }
      >
        <MenuEditor searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** "8 items, 1 sold out today" */
function count(rows: { soldOut: boolean }[], noun: string) {
  const out = rows.filter((row) => row.soldOut).length;
  const all = `${rows.length} ${noun}${rows.length === 1 ? "" : "s"}`;
  return out ? `${all}, ${out} sold out today` : all;
}

/**
 * A compact row: the photo (a Menu Item's, or its stand-in), then name,
 * price and pills, the button on the right.
 */
function Row({
  name,
  price,
  soldOut,
  hidden = false,
  photo,
  form,
}: {
  name: ReactNode;
  price: string;
  soldOut: boolean;
  hidden?: boolean;
  photo?: ReactNode;
  form: ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      {photo}
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <span className={soldOut ? "text-muted-foreground" : undefined}>
          {name}
        </span>
        <span className="font-mono text-sm tabular-nums">{price}</span>
        {soldOut && <Pill tone="warning">Sold out today</Pill>}
        {hidden && <Pill tone="muted">Hidden</Pill>}
      </span>
      {form}
    </li>
  );
}

/** The page's address for a Show pill and a View (batch 12.5). */
function menuHref(show: string, photos: boolean) {
  const query = new URLSearchParams();
  if (show) query.set("show", show);
  if (photos) query.set("view", "photos");
  return query.size ? `/manage/menu?${query}` : "/manage/menu";
}

const PILL =
  "border-input hover:bg-muted aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:border-primary inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline";

async function MenuEditor({
  searchParams,
}: {
  searchParams: PageProps<"/manage/menu">["searchParams"];
}) {
  const staff = await requireStaff("barista", "/manage/menu");
  const manager = staff.role === "manager";
  const [{ categories: all, optionGroups }, { show, view }] = await Promise.all(
    [getMenuForStaff(), searchParams]
  );
  // A pill shows one Category, or the Option Groups, instead of jumping
  // down a long page (owner, 2026-11-17, batch 12.2).
  const shown = typeof show === "string" ? show : "";
  const onlyOptions = shown === "options";
  const picked = all.find((c) => c.slug === shown);
  const categories = onlyOptions ? [] : picked ? [picked] : all;
  const showOptions = onlyOptions || (!picked && shown !== "options");
  // List rows, or photo cards for checking the photos (batch 12.5).
  const photos = view === "photos";
  return (
    <>
      {header(
        manager && (
          <>
            <Link href="/manage/menu/item/new" className={PRIMARY_PILL}>
              <PlusIcon aria-hidden size={18} />
              Add a Menu Item
            </Link>
            <Link href="/manage/menu/categories" className={OUTLINE_PILL}>
              Categories
            </Link>
            <Link href="/manage/menu/options/new" className={OUTLINE_PILL}>
              Add an Option Group
            </Link>
          </>
        )
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Show">
          <ul className="flex flex-wrap gap-2">
            {[
              ["", "Everything"],
              ...all.map((c) => [c.slug, c.name]),
              ["options", "Option Groups"],
            ].map(([value, label]) => (
              <li key={value || "all"}>
                <Link
                  href={menuHref(value, photos)}
                  scroll={false}
                  aria-current={
                    value === shown || (!value && !picked && !onlyOptions)
                      ? "page"
                      : undefined
                  }
                  className={PILL}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {!onlyOptions && (
          <nav aria-label="View" className="flex items-center gap-3">
            <ViewChoice
              label="List"
              href={menuHref(shown, false)}
              current={!photos}
            />
            {VIEW_THREAD}
            <ViewChoice
              label="Photos"
              href={menuHref(shown, true)}
              current={photos}
            />
          </nav>
        )}
      </div>

      {photos ? (
        <div className="mt-10 grid gap-14">
          {categories.map((category) => (
            <PhotoCards
              key={category.id}
              category={category}
              manager={manager}
            />
          ))}
        </div>
      ) : (
        <div
          className={`mt-8 grid gap-6 ${picked ? "" : "lg:grid-cols-2 2xl:grid-cols-3"}`}
        >
          {categories.map((category) => {
            const Icon = iconFor(category.slug);
            return (
              <Panel
                key={category.id}
                id={`category-${category.slug}`}
                title={category.name}
                icon={<Icon size={20} />}
                aside={
                  <span className="flex flex-wrap items-center gap-2">
                    {category.isHidden && <Pill tone="muted">Hidden</Pill>}
                    {count(category.items, "item")}
                  </span>
                }
              >
                {category.items.length === 0 ? (
                  <Empty icon={<Icon size={24} />}>
                    <p>Nothing in {category.name} yet.</p>
                    {manager && (
                      <Link
                        href={`/manage/menu/item/new?category=${category.id}`}
                        className={PRIMARY_PILL}
                      >
                        Add an item to {category.name}
                      </Link>
                    )}
                  </Empty>
                ) : (
                  <ul className="divide-border -my-2 divide-y">
                    {category.items.map((item) => (
                      <Row
                        key={item.id}
                        name={
                          manager ? (
                            <Link href={`/manage/menu/item/${item.id}`}>
                              {item.name}
                            </Link>
                          ) : (
                            item.name
                          )
                        }
                        price={formatPrice(item.baseCents)}
                        soldOut={item.soldOut}
                        hidden={item.isHidden}
                        photo={
                          <Photo
                            src={item.photoUrl}
                            alt={item.photoAlt ?? item.name}
                            kind={category.slug}
                            sizes="56px"
                            className="rounded-card size-14 shrink-0"
                          />
                        }
                        form={
                          <SoldOutForm
                            kind="item"
                            id={item.id}
                            name={item.name}
                            soldOut={item.soldOut}
                          />
                        }
                      />
                    ))}
                  </ul>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      {showOptions && (
        <section
          aria-labelledby="option-groups"
          className={onlyOptions ? "mt-8" : "mt-16"}
        >
          <h2
            id="option-groups"
            className="font-display scroll-mt-6 pb-1 text-3xl italic"
          >
            Option Groups
          </h2>
          {optionGroups.length === 0 ? (
            <div className="mt-6">
              <Empty icon={<SlidersHorizontalIcon size={24} />}>
                <p>No Option Groups yet. Sizes and milks live here.</p>
                {manager && (
                  <Link
                    href="/manage/menu/options/new"
                    className={PRIMARY_PILL}
                  >
                    Add an Option Group
                  </Link>
                )}
              </Empty>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {optionGroups.map((group) => (
                <Panel
                  key={group.id}
                  id={`group-${group.id}`}
                  headingLevel={3}
                  title={
                    manager ? (
                      <Link href={`/manage/menu/options/${group.id}`}>
                        {group.name}
                      </Link>
                    ) : (
                      group.name
                    )
                  }
                  icon={<SlidersHorizontalIcon size={20} />}
                  aside={count(group.options, "option")}
                >
                  <ul className="divide-border -my-2 divide-y">
                    {group.options.map((option) => (
                      <Row
                        key={option.id}
                        name={option.name}
                        price={formatDelta(option.deltaCents)}
                        soldOut={option.soldOut}
                        form={
                          <SoldOutForm
                            kind="option"
                            id={option.id}
                            name={option.name}
                            soldOut={option.soldOut}
                          />
                        }
                      />
                    ))}
                  </ul>
                </Panel>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

type StaffCategory = Awaited<
  ReturnType<typeof getMenuForStaff>
>["categories"][number];

/**
 * One Category as photo cards, as on /menu, so a missing or wrong photo
 * stands out (owner, 2026-11-18, batch 12.5).
 */
function PhotoCards({
  category,
  manager,
}: {
  category: StaffCategory;
  manager: boolean;
}) {
  return (
    <section
      aria-labelledby={`photos-${category.slug}`}
      id={`category-${category.slug}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2
          id={`photos-${category.slug}`}
          className="font-display pb-1 text-3xl italic"
        >
          {category.name}
        </h2>
        <span className="text-muted-foreground font-mono text-sm">
          {count(category.items, "item")}
        </span>
        {category.isHidden && <Pill tone="muted">Hidden</Pill>}
      </div>
      {category.items.length === 0 ? (
        <div className="mt-6">
          <Empty icon={createElement(iconFor(category.slug), { size: 24 })}>
            <p>Nothing in {category.name} yet.</p>
            {manager && (
              <Link
                href={`/manage/menu/item/new?category=${category.id}`}
                className={PRIMARY_PILL}
              >
                Add an item to {category.name}
              </Link>
            )}
          </Empty>
        </div>
      ) : (
        <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {category.items.map((item) => (
            <li key={item.id} className="grid content-start gap-3">
              <Photo
                src={item.photoUrl}
                alt={item.photoAlt ?? item.name}
                kind={category.slug}
                sizes="(min-width: 1536px) 18rem, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className={`rounded-card aspect-4/3 ${item.soldOut ? "opacity-50 grayscale" : ""}`}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="text-lg font-semibold">
                  {manager ? (
                    <Link
                      href={`/manage/menu/item/${item.id}`}
                      className="no-underline hover:underline"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    item.name
                  )}
                </h3>
                <span className="font-mono tabular-nums">
                  {formatPrice(item.baseCents)}
                </span>
              </div>
              {(item.soldOut || item.isHidden || !item.photoUrl) && (
                <div className="flex flex-wrap gap-2">
                  {item.soldOut && <Pill tone="warning">Sold out today</Pill>}
                  {item.isHidden && <Pill tone="muted">Hidden</Pill>}
                  {!item.photoUrl && <Pill tone="muted">No photo yet</Pill>}
                </div>
              )}
              <div className="justify-self-start">
                <SoldOutForm
                  kind="item"
                  id={item.id}
                  name={item.name}
                  soldOut={item.soldOut}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
