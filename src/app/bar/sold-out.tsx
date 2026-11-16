import type { getMenuForStaff } from "@/modules/menu";

import { toggleSoldOut } from "./actions";
import { SoldOutButton } from "./sold-out-button";

/** Sold out or Back on for one Menu Item or Option, in its own form. */
export function SoldOutForm({
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

type StaffMenu = Awaited<ReturnType<typeof getMenuForStaff>>;

/**
 * The Bar Screen's Sold Out list: the menu the Customer sees, and every
 * Option, closed until opened (STAFF-03, audit staff:8).
 */
export function SoldOut({ menu }: { menu: StaffMenu }) {
  const groups = [
    ...menu.categories
      .filter((category) => !category.isHidden)
      .map((category) => ({
        key: category.id,
        name: category.name,
        kind: "item" as const,
        rows: category.items.filter((item) => !item.isHidden),
      })),
    ...menu.optionGroups.map((group) => ({
      key: group.id,
      name: group.name,
      kind: "option" as const,
      rows: group.options,
    })),
  ].filter((group) => group.rows.length > 0);
  const out = groups.reduce(
    (sum, group) => sum + group.rows.filter((row) => row.soldOut).length,
    0
  );
  return (
    <details className="bg-muted rounded-card mt-4 p-3">
      <summary className="min-h-11 cursor-pointer py-2 text-xl font-semibold">
        Sold out today{" "}
        <span className="text-muted-foreground font-mono">{out}</span>
      </summary>
      <p className="text-muted-foreground mt-1">
        Ran out of something? Tap Sold out. It stays sold out for today only and
        comes back on by itself.
      </p>
      <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`sold-out-${group.key}`}>
            <h2 id={`sold-out-${group.key}`} className="font-semibold">
              {group.name}
            </h2>
            <ul className="divide-border mt-2 divide-y">
              {group.rows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span
                    className={
                      row.soldOut ? "text-muted-foreground" : undefined
                    }
                  >
                    {row.name}
                  </span>
                  <SoldOutForm
                    kind={group.kind}
                    id={row.id}
                    name={row.name}
                    soldOut={row.soldOut}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
