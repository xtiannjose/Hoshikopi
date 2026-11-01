import { cacheLife, cacheTag } from "next/cache";

import { manila, now } from "@/lib/clock";
import { db } from "@/lib/db";

import { allergenLine, containsNuts } from "./allergens";

export type MenuItemCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  baseCents: number;
  isDrink: boolean;
  /** Labels in display order; Barista Picks are in `picks`. */
  badges: string[];
  /** Barista Pick for the Day palette, the Night palette, or both (INFO-13). */
  picks: { day: boolean; night: boolean };
  photoUrl: string | null;
  photoAlt: string;
  soldOut: boolean;
  categorySlug: string;
};

export type MenuCategory = {
  slug: string;
  name: string;
  items: MenuItemCard[];
};

export type OptionView = {
  id: string;
  name: string;
  deltaCents: number;
  isDefault: boolean;
  soldOut: boolean;
};

export type OptionGroupView = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: OptionView[];
};

/** "Goes well with" (MENU-08); null `optionIds` means choose on its page. */
export type Pairing = MenuItemCard & { optionIds: string[] | null };

export type MenuItemDetail = MenuItemCard & {
  categoryName: string;
  allergenLine: string;
  optionGroups: OptionGroupView[];
  pairing: Pairing | null;
};

const BADGES: [string, string][] = [
  ["new", "New"],
  ["best_seller", "Best seller"],
  ["vegan", "Vegan"],
  ["no_caffeine", "No caffeine"],
];

function badgeLabels(badges: string[], allergens: string[]): string[] {
  const labels = BADGES.filter(([key]) => badges.includes(key)).map(
    ([, label]) => label
  );
  if (containsNuts(allergens)) labels.push("Contains nuts");
  return labels;
}

/** Sold Out while sold_out_on is today's Manila service day. */
function soldOutToday(soldOutOn: Date | null, today: string): boolean {
  return soldOutOn?.toISOString().slice(0, 10) === today;
}

const visibleItem = { isHidden: false, category: { isHidden: false } };

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  baseCents: true,
  isDrink: true,
  badges: true,
  allergens: true,
  photoUrl: true,
  photoAlt: true,
  soldOutOn: true,
  category: { select: { slug: true, name: true } },
} as const;

type CardRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  baseCents: number;
  isDrink: boolean;
  badges: string[];
  allergens: string[];
  photoUrl: string | null;
  photoAlt: string | null;
  soldOutOn: Date | null;
  category: { slug: string; name: string };
};

function toCard(row: CardRow, today: string): MenuItemCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    baseCents: row.baseCents,
    isDrink: row.isDrink,
    badges: badgeLabels(row.badges, row.allergens),
    picks: {
      day: row.badges.includes("barista_pick"),
      night: row.badges.includes("night_pick"),
    },
    photoUrl: row.photoUrl,
    photoAlt: row.photoAlt ?? row.name,
    soldOut: soldOutToday(row.soldOutOn, today),
    categorySlug: row.category.slug,
  };
}

/**
 * Visible Categories with their visible Menu Items. Cached under the `menu`
 * tag; Staff edits update it at once. The one-minute lifetime turns Sold Out
 * over after midnight and heals a refill that raced two quick saves.
 */
export async function getMenu(): Promise<MenuCategory[]> {
  "use cache";
  cacheTag("menu");
  cacheLife("minutes");
  const today = manila(now()).day;
  const categories = await db.category.findMany({
    where: { isHidden: false },
    orderBy: { sort: "asc" },
    select: {
      slug: true,
      name: true,
      items: {
        where: { isHidden: false },
        orderBy: { sort: "asc" },
        select: cardSelect,
      },
    },
  });
  return categories
    .filter((category) => category.items.length > 0)
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      items: category.items.map((item) => toCard(item, today)),
    }));
}

const detailSelect = {
  ...cardSelect,
  pairingId: true,
  optionGroups: {
    orderBy: { sort: "asc" },
    select: {
      optionGroup: {
        select: {
          id: true,
          name: true,
          minSelect: true,
          maxSelect: true,
          options: {
            orderBy: { sort: "asc" },
            select: {
              id: true,
              name: true,
              deltaCents: true,
              isDefault: true,
              addsAllergens: true,
              soldOutOn: true,
            },
          },
        },
      },
    },
  },
} as const;

type DetailRow = CardRow & {
  pairingId: string | null;
  optionGroups: {
    optionGroup: {
      id: string;
      name: string;
      minSelect: number;
      maxSelect: number;
      options: {
        id: string;
        name: string;
        deltaCents: number;
        isDefault: boolean;
        addsAllergens: string[];
        soldOutOn: Date | null;
      }[];
    };
  }[];
};

function groupViews(row: DetailRow, today: string): OptionGroupView[] {
  return row.optionGroups.map(({ optionGroup: group }) => ({
    id: group.id,
    name: group.name,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    options: group.options.map((option) => ({
      id: option.id,
      name: option.name,
      deltaCents: option.deltaCents,
      isDefault: option.isDefault,
      soldOut: soldOutToday(option.soldOutOn, today),
    })),
  }));
}

/**
 * The Options a one-tap add uses: each group's defaults, as its own page
 * starts (a Sold Out default gives way to the first left); null when a
 * required group has nothing left today.
 */
export function oneTapOptions(groups: OptionGroupView[]): string[] | null {
  const ids: string[] = [];
  for (const group of groups) {
    const available = group.options.filter((option) => !option.soldOut);
    let picked = available
      .filter((option) => option.isDefault)
      .slice(0, group.maxSelect);
    if (picked.length < group.minSelect) {
      picked = available.slice(0, group.minSelect);
    }
    if (picked.length < group.minSelect) return null;
    ids.push(...picked.map((option) => option.id));
  }
  return ids;
}

/** One visible Menu Item with its Option Groups and Pairing, or null. */
export async function getMenuItem(
  slug: string
): Promise<MenuItemDetail | null> {
  "use cache";
  cacheTag("menu");
  cacheLife("minutes");
  const today = manila(now()).day;
  const row = await db.menuItem.findFirst({
    where: { slug, ...visibleItem },
    select: detailSelect,
  });
  if (!row) return null;
  const pair = row.pairingId
    ? await db.menuItem.findFirst({
        where: { id: row.pairingId, ...visibleItem },
        select: detailSelect,
      })
    : null;
  return {
    ...toCard(row, today),
    categoryName: row.category.name,
    allergenLine: allergenLine(
      row.allergens,
      row.optionGroups.map(({ optionGroup }) => optionGroup)
    ),
    optionGroups: groupViews(row, today),
    pairing: pair && {
      ...toCard(pair, today),
      optionIds: oneTapOptions(groupViews(pair, today)),
    },
  };
}

/** Slugs to prerender: visible Menu Items and Categories. */
export async function menuSlugs(): Promise<{
  items: string[];
  categories: string[];
}> {
  "use cache";
  cacheTag("menu");
  cacheLife("minutes");
  const menu = await getMenu();
  return {
    categories: menu.map((category) => category.slug),
    items: menu.flatMap((category) => category.items.map((item) => item.slug)),
  };
}

/** Options that cost extra, for "Make it yours" under the printed menu. */
export async function getPricedOptions(): Promise<
  { name: string; deltaCents: number }[]
> {
  "use cache";
  cacheTag("menu");
  cacheLife("minutes");
  return db.option.findMany({
    where: { deltaCents: { gt: 0 } },
    orderBy: [{ optionGroup: { sort: "asc" } }, { sort: "asc" }],
    select: { name: true, deltaCents: true },
  });
}
