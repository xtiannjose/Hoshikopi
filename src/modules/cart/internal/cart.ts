import { randomUUID } from "node:crypto";

import { db, inTransaction, type Client } from "@/lib/db";
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
export const choiceKey = (line: {
  menuItemId: string;
  optionIds: string[];
  note: string;
}) =>
  [line.menuItemId, [...line.optionIds].sort().join(","), line.note].join("|");

export type AddResult =
  { ok: true } | { ok: false; reason: ChoiceRefusal["reason"] | "too_many" };

/** A Line's choices as the Cart keeps them: sorted Options, a trimmed note. */
function tidy(input: NewLine) {
  const note = input.note.trim().slice(0, MAX_NOTE_LENGTH);
  const optionIds = [...input.optionIds].sort();
  const key = choiceKey({ menuItemId: input.menuItemId, optionIds, note });
  const quantityOk = Number.isInteger(input.quantity) && input.quantity >= 1;
  return { note, optionIds, key, quantityOk };
}

/**
 * The owner's Cart, created if missing. Two first adds at once both get it:
 * the insert does nothing when the other one already made it.
 */
async function ensureCart(owner: CartOwner, client: Client) {
  const memberId = "memberId" in owner ? owner.memberId : null;
  const guestTokenHash = "memberId" in owner ? null : owner.guestTokenHash;
  await client.$executeRaw`
    INSERT INTO carts (id, member_id, guest_token_hash, updated_at)
    VALUES (${randomUUID()}, ${memberId}, ${guestTokenHash}, now())
    ON CONFLICT DO NOTHING`;
}

/**
 * Add a Menu Item with its Options to the Cart (ORD-01). Adds to one Cart
 * wait their turn on its row, so none overwrites another (audit tests:9).
 */
export async function addLine(
  owner: CartOwner,
  input: NewLine,
  client: Client = db
): Promise<AddResult> {
  const { note, optionIds, key, quantityOk } = tidy(input);
  if (!quantityOk) return { ok: false, reason: "invalid_options" };
  const [priced] = await priceChoices(
    [{ menuItemId: input.menuItemId, optionIds }],
    client
  );
  if (!priced.ok) return priced;
  await ensureCart(owner, client);
  return inTransaction(client, async (tx): Promise<AddResult> => {
    await lockCart(owner, tx);
    const cart = await tx.cart.findUniqueOrThrow({
      where: ownerWhere(owner),
      select: { id: true },
    });
    const existing = await tx.cartLine.findUnique({
      where: { cartId_choiceKey: { cartId: cart.id, choiceKey: key } },
    });
    const quantity = (existing?.quantity ?? 0) + input.quantity;
    if (quantity > MAX_LINE_QUANTITY) return { ok: false, reason: "too_many" };
    await tx.cartLine.upsert({
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
  });
}

/**
 * Change a Line's Options, quantity and note, priced again (PRD ORD-02,
 * audit journeys:14). The Menu Item stays; a Line that already has the new
 * choices takes this one's quantity, as adding it again would.
 */
export async function changeLine(
  owner: CartOwner,
  lineId: string,
  input: NewLine,
  client: Client = db
): Promise<AddResult | { ok: false; reason: "not_found" }> {
  const { note, optionIds, quantityOk } = tidy(input);
  if (!quantityOk) return { ok: false, reason: "invalid_options" };
  return inTransaction(client, async (tx) => {
    await lockCart(owner, tx);
    const line = await tx.cartLine.findFirst({
      where: { id: lineId, cart: ownerWhere(owner) },
    });
    if (!line) return { ok: false, reason: "not_found" } as const;
    const [priced] = await priceChoices(
      [{ menuItemId: line.menuItemId, optionIds }],
      tx
    );
    if (!priced.ok) return priced;
    const key = choiceKey({ menuItemId: line.menuItemId, optionIds, note });
    const same = await tx.cartLine.findUnique({
      where: { cartId_choiceKey: { cartId: line.cartId, choiceKey: key } },
    });
    const joins = same !== null && same.id !== line.id;
    const quantity = input.quantity + (joins ? same.quantity : 0);
    if (quantity > MAX_LINE_QUANTITY) {
      return { ok: false, reason: "too_many" } as const;
    }
    if (joins) {
      await tx.cartLine.update({ where: { id: same.id }, data: { quantity } });
      await tx.cartLine.delete({ where: { id: line.id } });
    } else {
      await tx.cartLine.update({
        where: { id: line.id },
        data: { optionIds, note, choiceKey: key, quantity },
      });
    }
    return { ok: true } as const;
  });
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

/**
 * Lock the owner's Cart row until the transaction ends, so a second request
 * on the same Cart (a double tap, two tabs, two renders after sign-in) waits
 * and then sees what the first one left. False when there is no Cart.
 */
export async function lockCart(owner: CartOwner, tx: Client): Promise<boolean> {
  const rows =
    "memberId" in owner
      ? await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM carts WHERE member_id = ${owner.memberId} FOR UPDATE`
      : await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM carts WHERE guest_token_hash = ${owner.guestTokenHash} FOR UPDATE`;
  return rows.length > 0;
}

/**
 * On sign-in, a Guest's Cart joins the Member's: identical choices add up
 * (at most 20 a Line), then the Guest Cart is gone (docs/03 section 5).
 */
export async function mergeGuestCart(
  guest: CartOwner,
  memberId: string
): Promise<void> {
  await db.$transaction(async (tx) => {
    // A merge already running for this Guest Cart finishes first; this one
    // then finds the Guest Cart gone.
    if (!(await lockCart(guest, tx))) return;
    const from = await tx.cart.findUnique({
      where: ownerWhere(guest),
      include: { lines: true },
    });
    if (!from) return;
    const to = await tx.cart.upsert({
      where: { memberId },
      update: {},
      create: { memberId },
    });
    for (const line of from.lines) {
      const existing = await tx.cartLine.findUnique({
        where: {
          cartId_choiceKey: { cartId: to.id, choiceKey: line.choiceKey },
        },
      });
      if (existing) {
        await tx.cartLine.update({
          where: { id: existing.id },
          data: {
            quantity: Math.min(
              existing.quantity + line.quantity,
              MAX_LINE_QUANTITY
            ),
          },
        });
      } else {
        await tx.cartLine.update({
          where: { id: line.id },
          data: { cartId: to.id },
        });
      }
    }
    await tx.cart.delete({ where: { id: from.id } });
  });
}

/** Deleting an account removes the Member's Cart and Favourites (ACC-03). */
export async function deleteMemberCart(memberId: string) {
  await db.$transaction([
    db.cart.deleteMany({ where: { memberId } }),
    db.favourite.deleteMany({ where: { memberId } }),
  ]);
}
