import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  addLine,
  getCart,
  mergeGuestCart,
  removeLine,
  updateQuantity,
} from "@/modules/cart";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const christian = { guestTokenHash: "christian-browser" };
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
    await addLine(christian, latte("Oat milk"));
    const again = latte("Oat milk", { quantity: 2 });
    await addLine(christian, {
      ...again,
      optionIds: [...again.optionIds].reverse(),
    });
    const cart = await getCart(christian);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]).toMatchObject({ quantity: 3, unitCents: 22000 });
    expect(cart.totalCents).toBe(66000);
  });

  it("keeps a different note or different Options on separate Lines", async () => {
    await addLine(christian, latte("Oat milk"));
    await addLine(christian, latte("Oat milk", { note: "less ice please" }));
    await addLine(christian, latte("Whole milk"));
    expect((await getCart(christian)).lines).toHaveLength(3);
  });

  it("prices every Line on the server and counts drinks and food Lines", async () => {
    await addLine(christian, latte("Whole milk", { quantity: 2 }));
    await addLine(christian, {
      menuItemId: items["ube-pandesal"],
      optionIds: [],
      quantity: 3,
      note: "",
    });
    expect(await getCart(christian)).toMatchObject({
      totalCents: 2 * 18500 + 3 * 7500,
      drinks: 2,
      foodLines: 1,
      blocked: false,
    });
  });

  it("flags a Line whose Menu Item became Hidden and blocks checkout", async () => {
    await addLine(christian, latte("Whole milk"));
    await addLine(christian, {
      menuItemId: items["ensaymada"],
      optionIds: [],
      quantity: 1,
      note: "",
    });
    await db.menuItem.update({
      where: { id: items["ensaymada"] },
      data: { isHidden: true },
    });
    const cart = await getCart(christian);
    expect(cart.lines.find((l) => l.name === "Ensaymada")).toMatchObject({
      problem: "unavailable",
      lineCents: null,
    });
    expect(cart).toMatchObject({ totalCents: 18500, blocked: true });
  });

  it("refuses choices the menu does not allow", async () => {
    expect(
      await addLine(christian, {
        ...latte("Whole milk"),
        optionIds: [ids["Regular"]],
      })
    ).toEqual({ ok: false, reason: "invalid_options" });
    expect(
      await addLine(christian, latte("Whole milk", { quantity: 21 }))
    ).toEqual({
      ok: false,
      reason: "too_many",
    });
  });

  it("changes a quantity, removes at zero, and only touches its own Cart", async () => {
    await addLine(christian, latte("Whole milk"));
    const [line] = (await getCart(christian)).lines;
    await updateQuantity(migs, line.id, 5);
    expect((await getCart(christian)).lines[0].quantity).toBe(1);
    await updateQuantity(christian, line.id, 4);
    expect((await getCart(christian)).lines[0].quantity).toBe(4);
    await updateQuantity(christian, line.id, 0);
    expect((await getCart(christian)).lines).toHaveLength(0);
    await addLine(christian, latte("Whole milk"));
    await removeLine(christian, (await getCart(christian)).lines[0].id);
    expect((await getCart(christian)).lines).toHaveLength(0);
  });
});

describe("mergeGuestCart (sign-in, docs/03 section 5)", () => {
  it("moves a Guest's Lines into the Member's Cart, adding identical ones", async () => {
    await db.user.create({
      data: {
        id: "seed-member",
        name: "Christian",
        email: "christian@hoshikopi.example",
      },
    });
    const member = { memberId: "seed-member" };
    await addLine(member, latte("Oat milk", { quantity: 2 }));
    await addLine(christian, latte("Oat milk", { quantity: 19 }));
    await addLine(christian, latte("Whole milk"));
    await mergeGuestCart(christian, "seed-member");
    const cart = await getCart(member);
    expect(cart.lines.map((l) => l.quantity).sort((a, b) => a - b)).toEqual([
      1, 20,
    ]);
    expect((await getCart(christian)).lines).toHaveLength(0);
  });
});
