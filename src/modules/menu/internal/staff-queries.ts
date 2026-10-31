import { manila, now } from "@/lib/clock";
import { db } from "@/lib/db";

// Fresh reads for Staff pages: Hidden things included, never cached.

const soldOutToday = (soldOutOn: Date | null) =>
  soldOutOn?.toISOString().slice(0, 10) === manila(now()).day;

export async function getMenuForStaff() {
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
        soldOut: soldOutToday(item.soldOutOn),
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
        addsAllergens: option.addsAllergens,
        sort: option.sort,
        soldOut: soldOutToday(option.soldOutOn),
      })),
    })),
  };
}

export type StaffMenu = Awaited<ReturnType<typeof getMenuForStaff>>;

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

export type MenuItemForEdit = NonNullable<
  Awaited<ReturnType<typeof getMenuItemForEdit>>
>;
