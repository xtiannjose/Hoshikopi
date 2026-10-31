import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { formatDelta, formatPrice } from "@/lib/money";
import { requireStaff } from "@/modules/identity";
import { getMenuForStaff } from "@/modules/menu";

import { toggleSoldOut } from "./actions";

export const metadata: Metadata = { title: "Menu" };

export default function ManageMenuPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="font-display pb-1 text-4xl italic">Menu</h1>
      <Suspense fallback={<p className="mt-4">Loading the menu...</p>}>
        <MenuEditor />
      </Suspense>
    </main>
  );
}

function SoldOutButton({
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
      <button
        type="submit"
        className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${soldOut ? "bg-primary text-primary-foreground border-primary" : "border-input"}`}
      >
        {soldOut ? "Back on" : "Sold out"}
        <span className="sr-only"> for {name}</span>
      </button>
    </form>
  );
}

async function MenuEditor() {
  const staff = await requireStaff("barista", "/manage/menu");
  const manager = staff.role === "manager";
  const { categories, optionGroups } = await getMenuForStaff();
  return (
    <div className="mt-6 grid gap-12">
      {manager && (
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/manage/menu/item/new" className="font-semibold">
            Add a Menu Item
          </Link>
          <Link href="/manage/menu/categories">Categories</Link>
          <Link href="/manage/menu/options/new">Add an Option Group</Link>
        </p>
      )}

      {categories.map((category) => (
        <section key={category.id} aria-labelledby={`c-${category.id}`}>
          <h2 id={`c-${category.id}`} className="font-display text-2xl italic">
            {category.name}
            {category.isHidden && (
              <span className="text-muted-foreground ml-2 font-sans text-sm not-italic">
                (Hidden)
              </span>
            )}
          </h2>
          <ul className="border-border mt-3 border-t">
            {category.items.map((item) => (
              <li
                key={item.id}
                className="border-border flex flex-wrap items-center justify-between gap-3 border-b py-2"
              >
                <span className="flex flex-wrap items-baseline gap-x-3">
                  {manager ? (
                    <Link href={`/manage/menu/item/${item.id}`}>
                      {item.name}
                    </Link>
                  ) : (
                    item.name
                  )}
                  <span className="font-mono text-sm">
                    {formatPrice(item.baseCents)}
                  </span>
                  {item.isHidden && (
                    <span className="text-muted-foreground text-sm">
                      Hidden
                    </span>
                  )}
                  {item.soldOut && (
                    <span className="text-warning text-sm font-semibold">
                      Sold out today
                    </span>
                  )}
                </span>
                <SoldOutButton
                  kind="item"
                  id={item.id}
                  name={item.name}
                  soldOut={item.soldOut}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section aria-labelledby="option-groups">
        <h2 id="option-groups" className="font-display text-2xl italic">
          Option Groups
        </h2>
        <div className="mt-3 grid gap-8">
          {optionGroups.map((group) => (
            <div key={group.id}>
              <h3 className="font-semibold">
                {manager ? (
                  <Link href={`/manage/menu/options/${group.id}`}>
                    {group.name}
                  </Link>
                ) : (
                  group.name
                )}
              </h3>
              <ul className="border-border mt-2 border-t">
                {group.options.map((option) => (
                  <li
                    key={option.id}
                    className="border-border flex flex-wrap items-center justify-between gap-3 border-b py-2"
                  >
                    <span>
                      {option.name}{" "}
                      <span className="font-mono text-sm">
                        {formatDelta(option.deltaCents)}
                      </span>
                      {option.soldOut && (
                        <span className="text-warning ml-3 text-sm font-semibold">
                          Sold out today
                        </span>
                      )}
                    </span>
                    <SoldOutButton
                      kind="option"
                      id={option.id}
                      name={option.name}
                      soldOut={option.soldOut}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
