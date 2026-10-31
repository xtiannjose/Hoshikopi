import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { addLine, getCart, removeLine, updateQuantity } from "@/modules/cart";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const bea = { guestTokenHash: "bea-browser" };
const migs = { guestTokenHash: "migs-browser" };
let ids: Record<string, string> = {};
let items: Record<string, string> = {};

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db, { people: false });
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
    await addLine(bea, latte("Oat milk"));
    const again = latte("Oat milk", { quantity: 2 });
    await addLine(bea, { ...again, optionIds: [...again.optionIds].reverse() });
    const cart = await getCart(bea);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]).toMatchObject({ quantity: 3, unitCents: 22000 });
    expect(cart.totalCents).toBe(66000);
  });

  it("keeps a different note or different Options on separate Lines", async () => {
    await addLine(bea, latte("Oat milk"));
    await addLine(bea, latte("Oat milk", { note: "less ice please" }));
    await addLine(bea, latte("Whole milk"));
    expect((await getCart(bea)).lines).toHaveLength(3);
  });

  it("prices every Line on the server and counts drinks and food Lines", async () => {
    await addLine(bea, latte("Whole milk", { quantity: 2 }));
    await addLine(bea, {
      menuItemId: items["ube-pandesal"],
      optionIds: [],
      quantity: 3,
      note: "",
    });
    expect(await getCart(bea)).toMatchObject({
      totalCents: 2 * 18500 + 3 * 7500,
      drinks: 2,
      foodLines: 1,
      blocked: false,
    });
  });

  it("flags a Line whose Menu Item became Hidden and blocks checkout", async () => {
    await addLine(bea, latte("Whole milk"));
    await addLine(bea, {
      menuItemId: items["ensaymada"],
      optionIds: [],
      quantity: 1,
      note: "",
    });
    await db.menuItem.update({
      where: { id: items["ensaymada"] },
      data: { isHidden: true },
    });
    const cart = await getCart(bea);
    expect(cart.lines.find((l) => l.name === "Ensaymada")).toMatchObject({
      problem: "unavailable",
      lineCents: null,
    });
    expect(cart).toMatchObject({ totalCents: 18500, blocked: true });
  });

  it("refuses choices the menu does not allow", async () => {
    expect(
      await addLine(bea, {
        ...latte("Whole milk"),
        optionIds: [ids["Regular"]],
      })
    ).toEqual({ ok: false, reason: "invalid_options" });
    expect(await addLine(bea, latte("Whole milk", { quantity: 21 }))).toEqual({
      ok: false,
      reason: "too_many",
    });
  });

  it("changes a quantity, removes at zero, and only touches its own Cart", async () => {
    await addLine(bea, latte("Whole milk"));
    const [line] = (await getCart(bea)).lines;
    await updateQuantity(migs, line.id, 5);
    expect((await getCart(bea)).lines[0].quantity).toBe(1);
    await updateQuantity(bea, line.id, 4);
    expect((await getCart(bea)).lines[0].quantity).toBe(4);
    await updateQuantity(bea, line.id, 0);
    expect((await getCart(bea)).lines).toHaveLength(0);
    await addLine(bea, latte("Whole milk"));
    await removeLine(bea, (await getCart(bea)).lines[0].id);
    expect((await getCart(bea)).lines).toHaveLength(0);
  });
});
