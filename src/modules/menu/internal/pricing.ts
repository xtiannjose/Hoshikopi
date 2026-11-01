import { manila, now } from "@/lib/clock";
import { db, type Client } from "@/lib/db";
import { addMoney } from "@/lib/money";

export type Choice = { menuItemId: string; optionIds: string[] };

export type PricedOption = {
  id: string;
  group: string;
  name: string;
  deltaCents: number;
};

export type PricedChoice = {
  ok: true;
  menuItemId: string;
  slug: string;
  name: string;
  isDrink: boolean;
  baseCents: number;
  /** In Option Group order, ready to snapshot on an Order Line. */
  options: PricedOption[];
  unitCents: number;
};

export type ChoiceRefusal = {
  ok: false;
  reason: "unavailable" | "sold_out" | "option_sold_out" | "invalid_options";
};

const day = (value: Date | null) => value?.toISOString().slice(0, 10);

/** Today's Base Price: a running Promo replaces it (MENU-06). */
export function todaysBase(
  item: {
    baseCents: number;
    promoCents: number | null;
    promoFrom: Date | null;
    promoUntil: Date | null;
  },
  today: string
): number {
  const from = day(item.promoFrom);
  const until = day(item.promoUntil);
  return item.promoCents !== null &&
    from &&
    until &&
    from <= today &&
    today <= until
    ? item.promoCents
    : item.baseCents;
}

/** Seasonal (MENU-06): on the menu through its last Manila day. */
export function inSeason(
  item: { availableUntil: Date | null },
  today: string
): boolean {
  return !item.availableUntil || day(item.availableUntil)! >= today;
}

/**
 * Prices each choice on the server (ORD-06, docs/03 section 5): the Base
 * Price plus the chosen Options' Price Deltas, after checking the choice
 * against the Menu Item's Option Groups (required groups present, least and
 * most picks, nothing Hidden or Sold Out today). Clients never send prices.
 */
export async function priceChoices(
  choices: Choice[],
  client: Client = db
): Promise<(PricedChoice | ChoiceRefusal)[]> {
  const today = manila(now()).day;
  const soldOut = (on: Date | null) => on?.toISOString().slice(0, 10) === today;
  const items = await client.menuItem.findMany({
    where: { id: { in: [...new Set(choices.map((c) => c.menuItemId))] } },
    include: {
      category: { select: { isHidden: true } },
      optionGroups: {
        orderBy: { sort: "asc" },
        include: {
          optionGroup: {
            include: { options: { orderBy: { sort: "asc" } } },
          },
        },
      },
    },
  });
  const byId = new Map(items.map((item) => [item.id, item]));

  return choices.map((choice): PricedChoice | ChoiceRefusal => {
    const item = byId.get(choice.menuItemId);
    if (
      !item ||
      item.isHidden ||
      item.category.isHidden ||
      !inSeason(item, today)
    ) {
      return { ok: false, reason: "unavailable" };
    }
    if (soldOut(item.soldOutOn)) return { ok: false, reason: "sold_out" };

    const picked = new Set(choice.optionIds);
    if (picked.size !== choice.optionIds.length) {
      return { ok: false, reason: "invalid_options" };
    }
    const options: PricedOption[] = [];
    let optionSoldOut = false;
    for (const { optionGroup: group } of item.optionGroups) {
      const inGroup = group.options.filter((option) => picked.has(option.id));
      if (
        inGroup.length < group.minSelect ||
        inGroup.length > group.maxSelect
      ) {
        return { ok: false, reason: "invalid_options" };
      }
      for (const option of inGroup) {
        options.push({
          id: option.id,
          group: group.name,
          name: option.name,
          deltaCents: option.deltaCents,
        });
        optionSoldOut ||= soldOut(option.soldOutOn);
      }
    }
    // An Option from a group this Menu Item does not offer.
    if (options.length !== picked.size) {
      return { ok: false, reason: "invalid_options" };
    }
    if (optionSoldOut) {
      return { ok: false, reason: "option_sold_out" };
    }
    const base = todaysBase(item, today);
    return {
      ok: true,
      menuItemId: item.id,
      slug: item.slug,
      name: item.name,
      isDrink: item.isDrink,
      baseCents: base,
      options,
      unitCents: addMoney(base, ...options.map((option) => option.deltaCents)),
    };
  });
}
