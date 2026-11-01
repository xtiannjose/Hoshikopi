import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { dayValue, manila, now } from "@/lib/clock";
import { db } from "@/lib/db";
import { parsePesos } from "@/lib/money";
import { audit, type Staff } from "@/modules/identity";

// Staff writes to the menu (STAFF-03, STAFF-04). Callers check the role and
// call updateTag("menu") after a successful write.

export const BADGE_KEYS = [
  "new",
  "best_seller",
  "barista_pick",
  "night_pick",
  "vegan",
  "no_caffeine",
] as const;

export const ALLERGEN_KEYS = [
  "milk",
  "egg",
  "wheat",
  "soy",
  "peanuts",
  "tree_nuts",
  "fish",
  "shellfish",
  "sesame",
] as const;

export type FormResult<T = object> =
  ({ ok: true } & T) | { ok: false; errors: Partial<Record<string, string>> };

const today = () => dayValue(manila(now()).day);

const pesos = (label: string) =>
  z.string().transform((value, ctx) => {
    const cents = parsePesos(value);
    if (cents === null) {
      ctx.addIssue({
        code: "custom",
        message: `Enter ${label} in pesos, like 185 or 35.50.`,
      });
      return z.NEVER;
    }
    return cents;
  });

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and dashes."
  )
  .max(60);

const checkbox = z.preprocess((v) => v === "on" || v === true, z.boolean());

function errorsOf(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    errors[String(issue.path[0])] ??= issue.message;
  }
  return errors;
}

const isUniqueClash = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

/** Sold Out today, or back on (Baristas and Managers). */
export async function setMenuItemSoldOut(
  id: string,
  soldOut: boolean,
  actor: Staff
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.menuItem.update({
      where: { id },
      data: { soldOutOn: soldOut ? today() : null },
    });
    await audit(
      actor,
      soldOut ? "menu.item.sold_out" : "menu.item.back_on",
      { type: "menu_item", id },
      {},
      tx
    );
  });
}

export async function setOptionSoldOut(
  id: string,
  soldOut: boolean,
  actor: Staff
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.option.update({
      where: { id },
      data: { soldOutOn: soldOut ? today() : null },
    });
    await audit(
      actor,
      soldOut ? "menu.option.sold_out" : "menu.option.back_on",
      { type: "option", id },
      {},
      tx
    );
  });
}

const MenuItemInput = z.object({
  categoryId: z.string().min(1, "Choose a Category."),
  name: z.string().trim().min(1, "Enter a name.").max(80),
  slug,
  description: z.string().trim().min(1, "Write one line.").max(200),
  basePrice: pesos("the Base Price"),
  isDrink: checkbox,
  isHidden: checkbox,
  badges: z.array(z.enum(BADGE_KEYS)),
  allergens: z.array(z.enum(ALLERGEN_KEYS)),
  optionGroupIds: z.array(z.string()),
  /** "Goes well with" (MENU-08); empty for none. */
  pairingId: z.string().optional(),
  /** A calorie estimate (MENU-10); empty for none. */
  calories: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || (/^\d+$/.test(v) && Number(v) <= 3000),
      "Enter a whole number of kcal up to 3000, or leave it empty."
    ),
  photoAlt: z.string().trim().max(160),
  sort: z.coerce.number().int().min(0).max(999),
});

export type MenuItemInput = z.input<typeof MenuItemInput>;

const PICKS_PER_PALETTE = 3;
const PICK_FULL = {
  barista_pick: "Three Day Barista Picks already. Untick one of them first.",
  night_pick: "Three Night Barista Picks already. Untick one of them first.",
} as const;

/** Create (no id) or edit a Menu Item; the photo URL is set separately. */
export async function saveMenuItem(
  id: string | null,
  input: MenuItemInput,
  actor: Staff,
  photoUrl?: string
): Promise<FormResult<{ id: string }>> {
  const parsed = MenuItemInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: errorsOf(parsed.error) };
  const { optionGroupIds, basePrice, photoAlt, pairingId, calories, ...data } =
    parsed.data;
  if (pairingId && pairingId === id) {
    return {
      ok: false,
      errors: { pairingId: "Choose a different Menu Item." },
    };
  }
  // INFO-13: the Manager picks three for each palette.
  for (const pick of ["barista_pick", "night_pick"] as const) {
    if (!data.badges.includes(pick)) continue;
    const others = await db.menuItem.count({
      where: { badges: { has: pick }, ...(id ? { id: { not: id } } : {}) },
    });
    if (others >= PICKS_PER_PALETTE) {
      return { ok: false, errors: { badges: PICK_FULL[pick] } };
    }
  }
  const fields = {
    ...data,
    baseCents: basePrice,
    photoAlt: photoAlt || null,
    // Absent leaves it as it is; empty clears it.
    pairingId: pairingId === undefined ? undefined : pairingId || null,
    calorieKcal: calories === undefined ? undefined : Number(calories) || null,
    ...(photoUrl ? { photoUrl } : {}),
  };
  try {
    const saved = await db.$transaction(async (tx) => {
      const item = id
        ? await tx.menuItem.update({ where: { id }, data: fields })
        : await tx.menuItem.create({ data: fields });
      await tx.menuItemOptionGroup.deleteMany({
        where: { menuItemId: item.id },
      });
      await tx.menuItemOptionGroup.createMany({
        data: optionGroupIds.map((optionGroupId, sort) => ({
          menuItemId: item.id,
          optionGroupId,
          sort,
        })),
      });
      await audit(
        actor,
        id ? "menu.item.update" : "menu.item.create",
        { type: "menu_item", id: item.id },
        { baseCents: item.baseCents },
        tx
      );
      return item;
    });
    return { ok: true, id: saved.id };
  } catch (error) {
    if (isUniqueClash(error)) {
      return { ok: false, errors: { slug: "Another Menu Item uses this." } };
    }
    throw error;
  }
}

const CategoryInput = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(40),
  slug,
  isHidden: checkbox,
  sort: z.coerce.number().int().min(0).max(999),
});

export async function saveCategory(
  id: string | null,
  input: z.input<typeof CategoryInput>,
  actor: Staff
): Promise<FormResult> {
  const parsed = CategoryInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: errorsOf(parsed.error) };
  try {
    await db.$transaction(async (tx) => {
      const category = id
        ? await tx.category.update({ where: { id }, data: parsed.data })
        : await tx.category.create({ data: parsed.data });
      await audit(
        actor,
        id ? "menu.category.update" : "menu.category.create",
        { type: "category", id: category.id },
        {},
        tx
      );
    });
    return { ok: true };
  } catch (error) {
    if (isUniqueClash(error)) {
      return { ok: false, errors: { slug: "Another Category uses this." } };
    }
    throw error;
  }
}

const OptionGroupInput = z
  .object({
    name: z.string().trim().min(1, "Enter a name.").max(40),
    minSelect: z.coerce.number().int().min(0).max(10),
    maxSelect: z.coerce.number().int().min(1).max(10),
  })
  .refine((g) => g.maxSelect >= g.minSelect, {
    path: ["maxSelect"],
    message: "Most picks can't be fewer than the least.",
  });

export async function saveOptionGroup(
  id: string | null,
  input: z.input<typeof OptionGroupInput>,
  actor: Staff
): Promise<FormResult<{ id: string }>> {
  const parsed = OptionGroupInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: errorsOf(parsed.error) };
  const group = await db.$transaction(async (tx) => {
    const saved = id
      ? await tx.optionGroup.update({ where: { id }, data: parsed.data })
      : await tx.optionGroup.create({ data: parsed.data });
    await audit(
      actor,
      id ? "menu.option_group.update" : "menu.option_group.create",
      { type: "option_group", id: saved.id },
      {},
      tx
    );
    return saved;
  });
  return { ok: true, id: group.id };
}

const OptionInput = z.object({
  optionGroupId: z.string().min(1),
  name: z.string().trim().min(1, "Enter a name.").max(40),
  priceDelta: pesos("the Price Delta"),
  isDefault: checkbox,
  addsAllergens: z.array(z.enum(ALLERGEN_KEYS)),
  sort: z.coerce.number().int().min(0).max(999),
});

export type OptionFormInput = z.input<typeof OptionInput>;

/**
 * Create or edit an Option. In a single-choice Option Group, making one the
 * default clears the others (one default per group).
 */
export async function saveOption(
  id: string | null,
  input: OptionFormInput,
  actor: Staff
): Promise<FormResult> {
  const parsed = OptionInput.safeParse(input);
  if (!parsed.success) return { ok: false, errors: errorsOf(parsed.error) };
  const { priceDelta, ...data } = parsed.data;
  await db.$transaction(async (tx) => {
    const group = await tx.optionGroup.findUniqueOrThrow({
      where: { id: data.optionGroupId },
    });
    if (data.isDefault && group.maxSelect === 1) {
      await tx.option.updateMany({
        where: { optionGroupId: group.id, ...(id ? { id: { not: id } } : {}) },
        data: { isDefault: false },
      });
    }
    const fields = { ...data, deltaCents: priceDelta };
    const option = id
      ? await tx.option.update({ where: { id }, data: fields })
      : await tx.option.create({ data: fields });
    await audit(
      actor,
      id ? "menu.option.update" : "menu.option.create",
      { type: "option", id: option.id },
      { deltaCents: option.deltaCents },
      tx
    );
  });
  return { ok: true };
}
