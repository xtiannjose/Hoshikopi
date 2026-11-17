import { createHash } from "node:crypto";

import { dayValue, manila, now } from "@/lib/clock";
import { db } from "@/lib/db";

import { isSoldOutToday } from "./pricing";

// Fresh reads for Staff pages: Hidden things included, never cached.

export async function getMenuForStaff() {
  const today = manila(now()).day;
  const [categories, groups] = await Promise.all([
    db.category.findMany({
      orderBy: { sort: "asc" },
      include: { items: { orderBy: { sort: "asc" } } },
    }),
    db.optionGroup.findMany({
      orderBy: { sort: "asc" },
      include: { options: { orderBy: { sort: "asc" } } },
    }),
  ]);
  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      isHidden: category.isHidden,
      sort: category.sort,
      items: category.items.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        baseCents: item.baseCents,
        isHidden: item.isHidden,
        soldOut: isSoldOutToday(item.soldOutOn, today),
      })),
    })),
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
        isHidden: option.isHidden,
        addsAllergens: option.addsAllergens,
        sort: option.sort,
        soldOut: isSoldOutToday(option.soldOutOn, today),
      })),
    })),
  };
}

export async function getMenuItemForEdit(id: string) {
  return db.menuItem.findUnique({
    where: { id },
    include: {
      optionGroups: {
        orderBy: { sort: "asc" },
        select: { optionGroupId: true },
      },
    },
  });
}

/** The Menu Items that offer an Option Group, in menu order. */
export async function itemsOfferingGroup(groupId: string) {
  return db.menuItem.findMany({
    where: { optionGroups: { some: { optionGroupId: groupId } } },
    orderBy: [{ category: { sort: "asc" } }, { sort: "asc" }],
    select: { id: true, name: true },
  });
}

/**
 * A short stamp of today's Sold Out marks and the Manila day. The Bar
 * Screen's poll compares it and refreshes its Sold Out panel when another
 * device changes a mark, or when the day turns and yesterday's marks clear
 * (audit DC-13).
 */
export async function soldOutStamp(at: Date): Promise<string> {
  const day = manila(at).day;
  const where = { soldOutOn: dayValue(day) };
  const [items, options] = await Promise.all([
    db.menuItem.findMany({
      where,
      select: { id: true },
      orderBy: { id: "asc" },
    }),
    db.option.findMany({ where, select: { id: true }, orderBy: { id: "asc" } }),
  ]);
  const marks = [...items, { id: "|" }, ...options].map((row) => row.id);
  return createHash("sha256")
    .update([day, ...marks].join(","))
    .digest("hex")
    .slice(0, 16);
}
