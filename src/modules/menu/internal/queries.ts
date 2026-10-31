import { cacheLife, cacheTag } from "next/cache";

import { manila, now } from "@/lib/clock";
import { db } from "@/lib/db";

import { allergenLine, containsNuts } from "./allergens";

export type MenuItemCard = {
  slug: string;
  name: string;
  description: string;
  baseCents: number;
  isDrink: boolean;
  /** Labels in display order, "Barista Pick" first. */
  badges: string[];
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

export type MenuItemDetail = MenuItemCard & {
  categoryName: string;
  allergenLine: string;
  optionGroups: OptionGroupView[];
};

const BADGES: [string, string][] = [
  ["barista_pick", "Barista Pick"],
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
    slug: row.slug,
    name: row.name,
    description: row.description,
    baseCents: row.baseCents,
    isDrink: row.isDrink,
    badges: badgeLabels(row.badges, row.allergens),
    photoUrl: row.photoUrl,
    photoAlt: row.photoAlt ?? row.name,
    soldOut: soldOutToday(row.soldOutOn, today),
    categorySlug: row.category.slug,
  };
}

/**
 * Visible Categories with their visible Menu Items. Cached under the `menu`
 * tag; Staff edits revalidate it, and the hourly lifetime turns Sold Out
 * over at the start of a new day.
 */
export async function getMenu(): Promise<MenuCategory[]> {
  "use cache";
  cacheTag("menu");
  cacheLife("hours");
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

/** One visible Menu Item with its Option Groups, or null. */
export async function getMenuItem(
  slug: string
): Promise<MenuItemDetail | null> {
  "use cache";
  cacheTag("menu");
  cacheLife("hours");
  const today = manila(now()).day;
  const row = await db.menuItem.findFirst({
    where: { slug, ...visibleItem },
    select: {
      ...cardSelect,
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
    },
  });
  if (!row) return null;
  const groups = row.optionGroups.map(({ optionGroup }) => optionGroup);
  return {
    ...toCard(row, today),
    categoryName: row.category.name,
    allergenLine: allergenLine(row.allergens, groups),
    optionGroups: groups.map((group) => ({
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
    })),
  };
}

/** Slugs to prerender: visible Menu Items and Categories. */
export async function menuSlugs(): Promise<{
  items: string[];
  categories: string[];
}> {
  "use cache";
  cacheTag("menu");
  cacheLife("hours");
  const menu = await getMenu();
  return {
    categories: menu.map((category) => category.slug),
    items: menu.flatMap((category) => category.items.map((item) => item.slug)),
  };
}
