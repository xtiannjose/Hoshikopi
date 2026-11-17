import { cacheLife, cacheTag } from "next/cache";

import { dayOf, dayValue, formatDay, manila, now } from "@/lib/clock";
import { db } from "@/lib/db";
import { BADGES } from "@/lib/menu-labels";

import { allergenLine, containsNuts } from "./allergens";
import { isSoldOutToday, todaysBase } from "./pricing";

export type MenuItemCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Today's price: a running Promo's, else the Base Price (MENU-06). */
  baseCents: number;
  /** The Base Price while a Promo runs, shown as "was"; else null. */
  regularCents: number | null;
  isDrink: boolean;
  /** Labels in display order; Barista Picks are in `picks`. */
  badges: string[];
  /** Barista Pick for the Day palette, the Night palette, or both (INFO-13). */
  picks: { day: boolean; night: boolean };
  /** What the /menu dietary filter reads: vegan, no-caffeine, nut-free (MENU-05). */
  tags: string[];
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
  /** For the default version; invented, shown as an estimate (MENU-10). */
  calorieKcal: number | null;
};

function badgeLabels(badges: string[], allergens: string[]): string[] {
  // Barista Picks show as the star in `picks`, not as a label.
  const labels: string[] = BADGES.filter(
    ([key]) =>
      key !== "barista_pick" && key !== "night_pick" && badges.includes(key)
  ).map(([, label]) => label);
  if (containsNuts(allergens)) labels.push("Contains nuts");
  return labels;
}

/**
 * The /menu dietary filter tags, read from keys, not labels (MENU-05,
 * audit architecture:17). Beans and merch get none: a Tumbler isn't a
 * nut-free snack. Only a drink is caffeine-free (audit journeys:22).
 */
export function filterTags(item: {
  badges: string[];
  allergens: string[];
  isDrink: boolean;
  categorySlug: string;
}): string[] {
  if (item.categorySlug === "beans-and-merch") return [];
  return [
    item.badges.includes("vegan") && "vegan",
    item.isDrink && item.badges.includes("no_caffeine") && "no-caffeine",
    !containsNuts(item.allergens) && "nut-free",
  ].filter((tag) => tag !== false);
}

const visibleItem = { isHidden: false, category: { isHidden: false } };

/** Seasonal Menu Items through their last Manila day (MENU-06). */
const inSeasonWhere = (today: string) => ({
  OR: [{ availableUntil: null }, { availableUntil: { gte: dayValue(today) } }],
});

const shortDay = (value: Date) => formatDay(dayOf(value));

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
  promoCents: true,
  promoFrom: true,
  promoUntil: true,
  availableUntil: true,
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
  promoCents: number | null;
  promoFrom: Date | null;
  promoUntil: Date | null;
  availableUntil: Date | null;
  category: { slug: string; name: string };
};

function toCard(row: CardRow, today: string): MenuItemCard {
  const base = todaysBase(row, today);
  const badges = badgeLabels(row.badges, row.allergens);
  if (base !== row.baseCents)
    badges.unshift(`Promo until ${shortDay(row.promoUntil!)}`);
  if (row.availableUntil) badges.push(`Until ${shortDay(row.availableUntil)}`);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    baseCents: base,
    regularCents: base !== row.baseCents ? row.baseCents : null,
    isDrink: row.isDrink,
    badges,
    picks: {
      day: row.badges.includes("barista_pick"),
      night: row.badges.includes("night_pick"),
    },
    tags: filterTags({ ...row, categorySlug: row.category.slug }),
    photoUrl: row.photoUrl,
    photoAlt: row.photoAlt ?? row.name,
    soldOut: isSoldOutToday(row.soldOutOn, today),
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
  cacheLife("menu");
  const today = manila(now()).day;
  const categories = await db.category.findMany({
    where: { isHidden: false },
    orderBy: { sort: "asc" },
    select: {
      slug: true,
      name: true,
      items: {
        where: { isHidden: false, ...inSeasonWhere(today) },
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
  calorieKcal: true,
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
            where: { isHidden: false },
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
  calorieKcal: number | null;
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
      soldOut: isSoldOutToday(option.soldOutOn, today),
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
  cacheLife("menu");
  const today = manila(now()).day;
  const row = await db.menuItem.findFirst({
    where: { slug, ...visibleItem, ...inSeasonWhere(today) },
    select: detailSelect,
  });
  if (!row) return null;
  const pair = row.pairingId
    ? await db.menuItem.findFirst({
        where: { id: row.pairingId, ...visibleItem, ...inSeasonWhere(today) },
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
    calorieKcal: row.calorieKcal,
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
  cacheLife("menu");
  // Its own read, not getMenu nested in another cache (audit staff:2).
  const today = manila(now()).day;
  const categories = await db.category.findMany({
    where: { isHidden: false },
    orderBy: { sort: "asc" },
    select: {
      slug: true,
      items: {
        where: { isHidden: false, ...inSeasonWhere(today) },
        orderBy: { sort: "asc" },
        select: { slug: true },
      },
    },
  });
  return {
    categories: categories.map((category) => category.slug),
    items: categories.flatMap((category) => category.items.map((i) => i.slug)),
  };
}

/** Options that cost extra, for "Make it yours" under the printed menu. */
export async function getPricedOptions(): Promise<
  { name: string; deltaCents: number }[]
> {
  "use cache";
  cacheTag("menu");
  cacheLife("menu");
  return db.option.findMany({
    where: { deltaCents: { gt: 0 }, isHidden: false },
    orderBy: [{ optionGroup: { sort: "asc" } }, { sort: "asc" }],
    select: { name: true, deltaCents: true },
  });
}
