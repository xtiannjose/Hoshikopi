import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db as appDb } from "@/lib/db";

import {
  addLine,
  changeLine,
  getCart,
  mergeGuestCart,
  pruneGuestCarts,
  removeLine,
  stepQuantity,
  updateQuantity,
} from "@/modules/cart";

import { createTestDb, resetToSeed } from "./helpers";

const db = createTestDb();
const hoshi = { guestTokenHash: "hoshi-browser" };
const migs = { guestTokenHash: "migs-browser" };
let ids: Record<string, string> = {};
let items: Record<string, string> = {};

beforeEach(async () => {
  await resetToSeed(db, { people: false });
  ids = {};
  items = {};
  for (const option of await db.option.findMany()) ids[option.name] = option.id;
  for (const item of await db.menuItem.findMany()) items[item.slug] = item.id;
});
afterAll(() => db.$disconnect());

const latte = (
  milk: string,
  extra: Partial<{ quantity: number; note: string }> = {}
) => ({
  menuItemId: items["hoshi-latte"],
  optionIds: [ids["Regular"], ids[milk], ids["100%"], ids["Normal"]],
  quantity: 1,
  note: "",
  ...extra,
});

describe("Cart (ORD-01, ORD-02)", () => {
  it("merges identical choices into one Line, whatever the Option order", async () => {
    await addLine(hoshi, latte("Oat milk"));
    const again = latte("Oat milk", { quantity: 2 });
    await addLine(hoshi, {
      ...again,
      optionIds: [...again.optionIds].reverse(),
    });
    const cart = await getCart(hoshi);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]).toMatchObject({ quantity: 3, unitCents: 22000 });
    expect(cart.totalCents).toBe(66000);
  });

  it("keeps a different note or different Options on separate Lines", async () => {
    await addLine(hoshi, latte("Oat milk"));
    await addLine(hoshi, latte("Oat milk", { note: "less ice please" }));
    await addLine(hoshi, latte("Whole milk"));
    expect((await getCart(hoshi)).lines).toHaveLength(3);
  });

  it("prices every Line on the server and counts drinks and food Lines", async () => {
    await addLine(hoshi, latte("Whole milk", { quantity: 2 }));
    await addLine(hoshi, {
      menuItemId: items["ube-pandesal"],
      optionIds: [],
      quantity: 3,
      note: "",
    });
    expect(await getCart(hoshi)).toMatchObject({
      totalCents: 2 * 18500 + 3 * 7500,
      drinks: 2,
      foodLines: 1,
      blocked: false,
    });
  });

  it("flags a Line whose Menu Item became Hidden and blocks checkout", async () => {
    await addLine(hoshi, latte("Whole milk"));
    await addLine(hoshi, {
      menuItemId: items["ensaymada"],
      optionIds: [],
      quantity: 1,
      note: "",
    });
    await db.menuItem.update({
      where: { id: items["ensaymada"] },
      data: { isHidden: true },
    });
    const cart = await getCart(hoshi);
    expect(cart.lines.find((l) => l.name === "Ensaymada")).toMatchObject({
      problem: "unavailable",
      lineCents: null,
    });
    expect(cart).toMatchObject({ totalCents: 18500, blocked: true });
  });

  it("refuses choices the menu does not allow", async () => {
    expect(
      await addLine(hoshi, {
        ...latte("Whole milk"),
        optionIds: [ids["Regular"]],
      })
    ).toEqual({ ok: false, reason: "invalid_options" });
    expect(await addLine(hoshi, latte("Whole milk", { quantity: 21 }))).toEqual(
      {
        ok: false,
        reason: "too_many",
      }
    );
  });

  // The steppers posted the new total, so two quick taps on "One more"
  // both sent 2 and the Line stayed at 2 (audit DC-32).
  it("steps one more or one less, every tap counting, in its own Cart only", async () => {
    await addLine(hoshi, latte("Whole milk"));
    const [line] = (await getCart(hoshi)).lines;
    await Promise.all([
      stepQuantity(hoshi, line.id, 1),
      stepQuantity(hoshi, line.id, 1),
    ]);
    expect((await getCart(hoshi)).lines[0].quantity).toBe(3);
    await stepQuantity(migs, line.id, 1);
    expect((await getCart(hoshi)).lines[0].quantity).toBe(3);
    await db.cartLine.update({
      where: { id: line.id },
      data: { quantity: 20 },
    });
    await stepQuantity(hoshi, line.id, 1);
    expect((await getCart(hoshi)).lines[0].quantity).toBe(20);
    await db.cartLine.update({ where: { id: line.id }, data: { quantity: 1 } });
    await stepQuantity(hoshi, line.id, -1);
    expect((await getCart(hoshi)).lines).toHaveLength(0);
  });

  it("changes a quantity, removes at zero, and only touches its own Cart", async () => {
    await addLine(hoshi, latte("Whole milk"));
    const [line] = (await getCart(hoshi)).lines;
    await updateQuantity(migs, line.id, 5);
    expect((await getCart(hoshi)).lines[0].quantity).toBe(1);
    await updateQuantity(hoshi, line.id, 4);
    expect((await getCart(hoshi)).lines[0].quantity).toBe(4);
    await updateQuantity(hoshi, line.id, 0);
    expect((await getCart(hoshi)).lines).toHaveLength(0);
    await addLine(hoshi, latte("Whole milk"));
    await removeLine(hoshi, (await getCart(hoshi)).lines[0].id);
    expect((await getCart(hoshi)).lines).toHaveLength(0);
  });
});

// Adds read the quantity and wrote it back with no lock, so adds at once
// overwrote each other, and two first adds raced on the new Cart (audit
// tests:9, ORD-10).
// A NUL in a note gave a 500; it is left out (audit SEC2-10).
describe("hidden characters", () => {
  it("refuses an id with one, as a script might send", async () => {
    expect(
      await addLine(hoshi, { ...latte("Oat milk"), menuItemId: "\u0000" })
    ).toEqual({ ok: false, reason: "unavailable" });
    expect(await changeLine(hoshi, "\u0000", latte("Oat milk"))).toEqual({
      ok: false,
      reason: "not_found",
    });
    await updateQuantity(hoshi, "\u0000", 2);
    await removeLine(hoshi, "\u0000");
  });

  it("leaves them out of a note", async () => {
    expect(
      await addLine(hoshi, latte("Oat milk", { note: "less ice\u0000" }))
    ).toEqual({ ok: true });
    expect((await getCart(hoshi)).lines[0].note).toBe("less ice");
  });
});

// A Cart had no cap, so a script could add Lines without end (audit CK-01).
describe("a full Cart", () => {
  it("holds 30 Lines: a new choice is refused, more of one already in it is not", async () => {
    for (let n = 0; n < 30; n++) {
      expect(
        await addLine(hoshi, latte("Oat milk", { note: `cup ${n}` }))
      ).toEqual({ ok: true });
    }
    expect(await addLine(hoshi, latte("Oat milk", { note: "cup 30" }))).toEqual(
      {
        ok: false,
        reason: "cart_full",
      }
    );
    expect(await addLine(hoshi, latte("Oat milk", { note: "cup 0" }))).toEqual({
      ok: true,
    });
    const cart = await getCart(hoshi);
    expect(cart.lines).toHaveLength(30);
  });
});

describe("adding at once", () => {
  it("adds up six adds to one Line, with no error", async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, () => addLine(hoshi, latte("Oat milk")))
    );
    expect(results.every((result) => result.ok)).toBe(true);
    const cart = await getCart(hoshi);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].quantity).toBe(6);
  });
});

// A Line's Options, quantity and note change in the Cart (PRD ORD-02,
// audit journeys:14).
describe("changeLine", () => {
  it("changes a Line's Options, quantity and note, priced again", async () => {
    await addLine(hoshi, latte("Oat milk"));
    const [line] = (await getCart(hoshi)).lines;
    expect(
      await changeLine(
        hoshi,
        line.id,
        latte("Whole milk", { quantity: 2, note: "less ice please" })
      )
    ).toEqual({ ok: true });
    const cart = await getCart(hoshi);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]).toMatchObject({
      id: line.id,
      quantity: 2,
      note: "less ice please",
      unitCents: 18500,
    });
    expect(cart.lines[0].options.map((o) => o.name)).toContain("Whole milk");
  });

  it("joins a Line that already has those choices", async () => {
    await addLine(hoshi, latte("Oat milk"));
    await addLine(hoshi, latte("Whole milk", { quantity: 2 }));
    const oat = (await getCart(hoshi)).lines[0];
    expect(await changeLine(hoshi, oat.id, latte("Whole milk"))).toEqual({
      ok: true,
    });
    const cart = await getCart(hoshi);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].quantity).toBe(3);
  });

  it("refuses more than 20 of one choice, choices the menu doesn't allow, and another Cart's Line", async () => {
    await addLine(hoshi, latte("Oat milk", { quantity: 15 }));
    await addLine(hoshi, latte("Whole milk", { quantity: 10 }));
    const [oat] = (await getCart(hoshi)).lines;
    expect(
      await changeLine(hoshi, oat.id, latte("Whole milk", { quantity: 15 }))
    ).toEqual({ ok: false, reason: "too_many" });
    expect(
      await changeLine(hoshi, oat.id, {
        ...latte("Oat milk"),
        optionIds: [ids["Oat milk"]],
      })
    ).toMatchObject({ ok: false, reason: "invalid_options" });
    expect(await changeLine(migs, oat.id, latte("Whole milk"))).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect((await getCart(hoshi)).lines.map((l) => l.quantity)).toEqual([
      15, 10,
    ]);
  });
});

describe("mergeGuestCart (sign-in, docs/03 section 5)", () => {
  it("moves a Guest's Lines into the Member's Cart, adding identical ones", async () => {
    await db.user.create({
      data: {
        id: "seed-member",
        name: "Hoshi",
        email: "hoshi@hoshikopi.example",
      },
    });
    const member = { memberId: "seed-member" };
    await addLine(member, latte("Oat milk", { quantity: 2 }));
    await addLine(hoshi, latte("Oat milk", { quantity: 19 }));
    await addLine(hoshi, latte("Whole milk"));
    await mergeGuestCart(hoshi, "seed-member");
    const cart = await getCart(member);
    expect(cart.lines.map((l) => l.quantity).sort((a, b) => a - b)).toEqual([
      1, 20,
    ]);
    expect((await getCart(hoshi)).lines).toHaveLength(0);
  });

  // The header and the page both ask for the Cart in the first render after
  // the email link, so two merges can start at once (audit, 7.1).
  it("merges once when two requests sign in with the same Guest Cart at once", async () => {
    await db.user.create({
      data: { id: "new-member", name: "Migs", email: "migs@example.com" },
    });
    await addLine(hoshi, latte("Oat milk", { quantity: 2 }));
    await addLine(hoshi, latte("Whole milk"));
    await Promise.all([
      mergeGuestCart(hoshi, "new-member"),
      mergeGuestCart(hoshi, "new-member"),
    ]);
    const cart = await getCart({ memberId: "new-member" });
    expect(cart.lines.map((l) => l.quantity).sort((a, b) => a - b)).toEqual([
      1, 2,
    ]);
    expect((await getCart(hoshi)).lines).toHaveLength(0);
  });
});

// Abandoned guest Carts were kept for ever (audit ops:9).
describe("pruneGuestCarts", () => {
  it("deletes guest Carts untouched for 30 days, never a Member's", async () => {
    await addLine(hoshi, latte("Oat milk"));
    await addLine(migs, latte("Oat milk"));
    await db.user.create({
      data: { id: "tala", email: "tala@example.com", name: "Tala" },
    });
    await addLine({ memberId: "tala" }, latte("Oat milk"));
    const old = new Date(Date.now() - 31 * 86_400_000);
    await db.cart.updateMany({ data: { updatedAt: old } });
    await db.cartLine.updateMany({ data: { updatedAt: old } });
    // Migs touched a Line yesterday.
    await db.cartLine.updateMany({
      where: { cart: { guestTokenHash: "migs-browser" } },
      data: { updatedAt: new Date(Date.now() - 86_400_000) },
    });
    expect(await pruneGuestCarts(new Date())).toBe(1);
    expect((await getCart(hoshi)).lines).toHaveLength(0);
    expect((await getCart(migs)).lines).toHaveLength(1);
    expect((await getCart({ memberId: "tala" })).lines).toHaveLength(1);
  });
});

// The hk_cart cookie stays after a merge, so every page a signed-in Member
// opened ran a merge transaction for up to 30 days (audit ORD-02).
describe("mergeGuestCart with no Guest Cart left", () => {
  it("costs one read and opens no transaction", async () => {
    const transaction = vi.spyOn(appDb, "$transaction");
    await mergeGuestCart({ guestTokenHash: "already-merged" }, "tala");
    expect(transaction).not.toHaveBeenCalled();
    transaction.mockRestore();
  });
});
