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
    if (!item || item.isHidden || item.category.isHidden) {
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
    return {
      ok: true,
      menuItemId: item.id,
      slug: item.slug,
      name: item.name,
      isDrink: item.isDrink,
      baseCents: item.baseCents,
      options,
      unitCents: addMoney(
        item.baseCents,
        ...options.map((option) => option.deltaCents)
      ),
    };
  });
}
