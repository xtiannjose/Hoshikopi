import { db } from "@/lib/db";
import { priceChoices, type ChoiceRefusal } from "@/modules/menu";

import { choiceKey } from "./cart";

const MAX_FAVOURITES = 20;

export type FavouriteResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "invalid_options" | "too_many" };

/**
 * Save a Menu Item with its Options for a Member (ORD-11). Saving the same
 * choice again changes nothing; Sold Out today may still be saved.
 */
export async function saveFavourite(
  memberId: string,
  choice: { menuItemId: string; optionIds: string[] }
): Promise<FavouriteResult> {
  const optionIds = [...choice.optionIds].sort();
  const [priced] = await priceChoices([
    { menuItemId: choice.menuItemId, optionIds },
  ]);
  if (
    !priced.ok &&
    (priced.reason === "unavailable" || priced.reason === "invalid_options")
  ) {
    return { ok: false, reason: priced.reason };
  }
  const key = choiceKey({ menuItemId: choice.menuItemId, optionIds, note: "" });
  const saved = await db.favourite.findUnique({
    where: { memberId_choiceKey: { memberId, choiceKey: key } },
  });
  if (saved) return { ok: true };
  if ((await db.favourite.count({ where: { memberId } })) >= MAX_FAVOURITES) {
    return { ok: false, reason: "too_many" };
  }
  await db.favourite.createMany({
    data: [
      { memberId, menuItemId: choice.menuItemId, optionIds, choiceKey: key },
    ],
    skipDuplicates: true,
  });
  return { ok: true };
}

export type FavouriteView = {
  id: string;
  menuItemId: string;
  optionIds: string[];
  slug: string;
  name: string;
  options: string[];
  /** Today's price; null when it can't be ordered today. */
  unitCents: number | null;
  available: boolean;
  problem: ChoiceRefusal["reason"] | null;
};

/** A Member's Favourites, priced today, oldest first. */
export async function favouritesFor(
  memberId: string
): Promise<FavouriteView[]> {
  const rows = await db.favourite.findMany({
    where: { memberId },
    orderBy: { createdAt: "asc" },
    include: { menuItem: { select: { name: true, slug: true } } },
  });
  const priced = await priceChoices(
    rows.map((row) => ({
      menuItemId: row.menuItemId,
      optionIds: row.optionIds,
    }))
  );
  // Names for a Favourite that can't be priced today.
  const names = new Map(
    (
      await db.option.findMany({
        where: { id: { in: rows.flatMap((row) => row.optionIds) } },
        select: { id: true, name: true },
      })
    ).map((option) => [option.id, option.name])
  );
  return rows.map((row, i) => {
    const price = priced[i];
    return {
      id: row.id,
      menuItemId: row.menuItemId,
      optionIds: row.optionIds,
      slug: row.menuItem.slug,
      name: row.menuItem.name,
      options: price.ok
        ? price.options.map((option) => option.name)
        : row.optionIds.flatMap((id) => names.get(id) ?? []),
      unitCents: price.ok ? price.unitCents : null,
      available: price.ok,
      problem: price.ok ? null : price.reason,
    };
  });
}

/** Remove one of the Member's own Favourites. */
export async function removeFavourite(
  memberId: string,
  favouriteId: string
): Promise<void> {
  await db.favourite.deleteMany({ where: { id: favouriteId, memberId } });
}
