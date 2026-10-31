import { db, type Client } from "@/lib/db";
import { addMoney } from "@/lib/money";
import {
  priceChoices,
  type ChoiceRefusal,
  type PricedOption,
} from "@/modules/menu";

/** A Cart belongs to one Guest browser or one Member, never both. */
export type CartOwner = { guestTokenHash: string } | { memberId: string };

export const MAX_LINE_QUANTITY = 20;
export const MAX_NOTE_LENGTH = 140;

export type NewLine = {
  menuItemId: string;
  optionIds: string[];
  quantity: number;
  note: string;
};

export type CartLineView = {
  id: string;
  menuItemId: string;
  slug: string;
  name: string;
  options: PricedOption[];
  quantity: number;
  note: string;
  isDrink: boolean;
  /** Null when the Line can't be ordered any more (see `problem`). */
  unitCents: number | null;
  lineCents: number | null;
  problem: ChoiceRefusal["reason"] | null;
};

export type CartView = {
  lines: CartLineView[];
  /** Server-priced total of the Lines that can be ordered. */
  totalCents: number;
  drinks: number;
  foodLines: number;
  /** A flagged Line blocks checkout until removed (docs/03 section 5). */
  blocked: boolean;
};

const ownerWhere = (owner: CartOwner) =>
  "memberId" in owner
    ? { memberId: owner.memberId }
    : { guestTokenHash: owner.guestTokenHash };

/** Identical choices share a key, so they merge into one Line. */
const choiceKey = (line: {
  menuItemId: string;
  optionIds: string[];
  note: string;
}) =>
  [line.menuItemId, [...line.optionIds].sort().join(","), line.note].join("|");

export type AddResult =
  { ok: true } | { ok: false; reason: ChoiceRefusal["reason"] | "too_many" };

/** Add a Menu Item with its Options to the Cart (ORD-01). */
export async function addLine(
  owner: CartOwner,
  input: NewLine,
  client: Client = db
): Promise<AddResult> {
  const note = input.note.trim().slice(0, MAX_NOTE_LENGTH);
  const optionIds = [...input.optionIds].sort();
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    return { ok: false, reason: "invalid_options" };
  }
  const [priced] = await priceChoices(
    [{ menuItemId: input.menuItemId, optionIds }],
    client
  );
  if (!priced.ok) return priced;
  const key = choiceKey({ menuItemId: input.menuItemId, optionIds, note });
  const cart = await client.cart.upsert({
    where: ownerWhere(owner),
    update: {},
    create: ownerWhere(owner),
    select: { id: true },
  });
  const existing = await client.cartLine.findUnique({
    where: { cartId_choiceKey: { cartId: cart.id, choiceKey: key } },
  });
  const quantity = (existing?.quantity ?? 0) + input.quantity;
  if (quantity > MAX_LINE_QUANTITY) return { ok: false, reason: "too_many" };
  await client.cartLine.upsert({
    where: { cartId_choiceKey: { cartId: cart.id, choiceKey: key } },
    update: { quantity },
    create: {
      cartId: cart.id,
      menuItemId: input.menuItemId,
      optionIds,
      quantity,
      note,
      choiceKey: key,
    },
  });
  return { ok: true };
}

/** The Cart with every Line priced on the server (ORD-02, ORD-06). */
export async function getCart(
  owner: CartOwner,
  client: Client = db
): Promise<CartView> {
  const cart = await client.cart.findUnique({
    where: ownerWhere(owner),
    include: {
      lines: {
        orderBy: { createdAt: "asc" },
        include: {
          menuItem: { select: { slug: true, name: true, isDrink: true } },
        },
      },
    },
  });
  const rows = cart?.lines ?? [];
  const priced = await priceChoices(
    rows.map((row) => ({
      menuItemId: row.menuItemId,
      optionIds: row.optionIds,
    })),
    client
  );
  const lines = rows.map((row, index): CartLineView => {
    const price = priced[index];
    return {
      id: row.id,
      menuItemId: row.menuItemId,
      slug: row.menuItem.slug,
      name: row.menuItem.name,
      options: price.ok ? price.options : [],
      quantity: row.quantity,
      note: row.note,
      isDrink: row.menuItem.isDrink,
      unitCents: price.ok ? price.unitCents : null,
      lineCents: price.ok ? price.unitCents * row.quantity : null,
      problem: price.ok ? null : price.reason,
    };
  });
  const orderable = lines.filter((line) => line.problem === null);
  return {
    lines,
    totalCents: addMoney(...orderable.map((line) => line.lineCents ?? 0)),
    drinks: orderable
      .filter((line) => line.isDrink)
      .reduce((sum, line) => sum + line.quantity, 0),
    foodLines: orderable.filter((line) => !line.isDrink).length,
    blocked: lines.some((line) => line.problem !== null),
  };
}

/** Set a Line's quantity; 0 removes it. Only Lines in the owner's Cart. */
export async function updateQuantity(
  owner: CartOwner,
  lineId: string,
  quantity: number,
  client: Client = db
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 0) return;
  if (quantity === 0) return removeLine(owner, lineId, client);
  await client.cartLine.updateMany({
    where: { id: lineId, cart: ownerWhere(owner) },
    data: { quantity: Math.min(quantity, MAX_LINE_QUANTITY) },
  });
}

export async function removeLine(
  owner: CartOwner,
  lineId: string,
  client: Client = db
): Promise<void> {
  await client.cartLine.deleteMany({
    where: { id: lineId, cart: ownerWhere(owner) },
  });
}

/** Empty the Cart after its Order is placed. */
export async function clearCart(owner: CartOwner, client: Client = db) {
  await client.cartLine.deleteMany({ where: { cart: ownerWhere(owner) } });
}
