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
import { iconFor } from "@/components/photo";
import { formatDelta, formatPrice } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { getMenuForStaff } from "@/modules/menu";

import { toggleSoldOut } from "./actions";
import { SoldOutButton } from "./sold-out-button";

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

export default function ManageMenuPage() {
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
        <MenuEditor />
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

function SoldOutForm({
  kind,
  id,
  name,
  soldOut,
}: {
  kind: "item" | "option";
  id: string;
  name: string;
  soldOut: boolean;
}) {
  return (
    <form action={toggleSoldOut}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="soldOut" value={soldOut ? "0" : "1"} />
      <SoldOutButton name={name} soldOut={soldOut} />
    </form>
  );
}

/** A compact row: name, price and pills on the left, the button on the right. */
function Row({
  name,
  price,
  soldOut,
  hidden = false,
  form,
}: {
  name: ReactNode;
  price: string;
  soldOut: boolean;
  hidden?: boolean;
  form: ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
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

async function MenuEditor() {
  const staff = await requireStaff("barista", "/manage/menu");
  const manager = staff.role === "manager";
  const { categories, optionGroups } = await getMenuForStaff();
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

      <nav aria-label="Jump to" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {[
            ...categories.map((c) => [`category-${c.slug}`, c.name]),
            ["option-groups", "Option Groups"],
          ].map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="border-input hover:bg-muted inline-flex min-h-11 items-center rounded-full border px-4 text-sm no-underline"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
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

      <section aria-labelledby="option-groups" className="mt-16">
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
                <Link href="/manage/menu/options/new" className={PRIMARY_PILL}>
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
    </>
  );
}
