import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
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

const PILL =
  "border-input hover:bg-muted aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-[current=page]:border-primary inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline";

async function MenuEditor({
  searchParams,
}: {
  searchParams: PageProps<"/manage/menu">["searchParams"];
}) {
  const staff = await requireStaff("barista", "/manage/menu");
  const manager = staff.role === "manager";
  const [{ categories: all, optionGroups }, { show }] = await Promise.all([
    getMenuForStaff(),
    searchParams,
  ]);
  // A pill shows one Category, or the Option Groups, instead of jumping
  // down a long page (owner, 2026-11-17, batch 12.2).
  const shown = typeof show === "string" ? show : "";
  const onlyOptions = shown === "options";
  const picked = all.find((c) => c.slug === shown);
  const categories = onlyOptions ? [] : picked ? [picked] : all;
  const showOptions = onlyOptions || (!picked && shown !== "options");
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

      <nav aria-label="Show" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {[
            ["", "Everything"],
            ...all.map((c) => [c.slug, c.name]),
            ["options", "Option Groups"],
          ].map(([value, label]) => (
            <li key={value || "all"}>
              <Link
                href={value ? `/manage/menu?show=${value}` : "/manage/menu"}
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
