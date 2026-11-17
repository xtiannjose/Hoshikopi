import { dayOf, manila, now } from "@/lib/clock";
import { db, type Client } from "@/lib/db";
import { addMoney } from "@/lib/money";
import { isPlainText } from "@/lib/text";

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

/** Sold Out while sold_out_on is today's Manila service day. */
export function isSoldOutToday(soldOutOn: Date | null, today: string): boolean {
  return soldOutOn !== null && dayOf(soldOutOn) === today;
}

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
  return item.promoCents !== null &&
    item.promoFrom &&
    item.promoUntil &&
    dayOf(item.promoFrom) <= today &&
    today <= dayOf(item.promoUntil)
    ? item.promoCents
    : item.baseCents;
}

/** Seasonal (MENU-06): on the menu through its last Manila day. */
function inSeason(
  item: { availableUntil: Date | null },
  today: string
): boolean {
  return !item.availableUntil || dayOf(item.availableUntil) >= today;
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
  const items = await client.menuItem.findMany({
    // An id with a NUL is no Menu Item, and Postgres would refuse it with a
    // 500 (audit SEC2-10): it prices as unavailable.
    where: {
      id: {
        in: [...new Set(choices.map((c) => c.menuItemId).filter(isPlainText))],
      },
    },
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
    if (isSoldOutToday(item.soldOutOn, today))
      return { ok: false, reason: "sold_out" };

    const picked = new Set(choice.optionIds);
    if (picked.size !== choice.optionIds.length) {
      return { ok: false, reason: "invalid_options" };
    }
    const options: PricedOption[] = [];
    let optionSoldOut = false;
    for (const { optionGroup: group } of item.optionGroups) {
      // A Hidden Option is not on offer (audit staff:9).
      const inGroup = group.options.filter(
        (option) => !option.isHidden && picked.has(option.id)
      );
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
        optionSoldOut ||= isSoldOutToday(option.soldOutOn, today);
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
