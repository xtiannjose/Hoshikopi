import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import {
  addLine,
  deleteMemberCart,
  favouritesFor,
  getCart,
  removeFavourite,
  saveFavourite,
} from "@/modules/cart";
import { orderAgain, placeOrder } from "@/modules/ordering";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const HOSHI = "seed-member";
const ids: Record<string, string> = {};
const items: Record<string, string> = {};

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
  for (const option of await db.option.findMany()) ids[option.name] = option.id;
  for (const item of await db.menuItem.findMany()) items[item.slug] = item.id;
  freezeClock("2026-11-02T01:00:00Z"); // 9:00 AM Monday in Manila
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

const oatLatte = () => ({
  menuItemId: items["hoshi-latte"],
  optionIds: [ids["Large"], ids["Oat milk"], ids["50%"], ids["Normal"]],
});

describe("Favourites (ORD-11)", () => {
  it("saves a Menu Item with its Options once and prices it today", async () => {
    expect(await saveFavourite(HOSHI, oatLatte())).toEqual({ ok: true });
    expect(await saveFavourite(HOSHI, oatLatte())).toEqual({ ok: true });

    const saved = await favouritesFor(HOSHI);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name: "Hoshi Latte",
      options: ["Large", "Oat milk", "50%", "Normal"],
      unitCents: 25000,
      available: true,
    });

    await db.menuItem.update({
      where: { id: items["hoshi-latte"] },
      data: { soldOutOn: new Date("2026-11-02") },
    });
    expect((await favouritesFor(HOSHI))[0]).toMatchObject({
      available: false,
    });
  });

  it("refuses a choice the Menu Item does not offer", async () => {
    expect(
      await saveFavourite(HOSHI, {
        menuItemId: items["hoshi-latte"],
        optionIds: [ids["Large"]],
      })
    ).toEqual({ ok: false, reason: "invalid_options" });
    expect(await favouritesFor(HOSHI)).toEqual([]);
  });

  it("are forgotten with the Member's Cart when the account is deleted", async () => {
    await saveFavourite(HOSHI, oatLatte());
    await deleteMemberCart(HOSHI);
    expect(await favouritesFor(HOSHI)).toEqual([]);
  });

  it("removes only the Member's own Favourite", async () => {
    await saveFavourite(HOSHI, oatLatte());
    const [saved] = await favouritesFor(HOSHI);

    await removeFavourite("seed-manager", saved.id);
    expect(await favouritesFor(HOSHI)).toHaveLength(1);
    await removeFavourite(HOSHI, saved.id);
    expect(await favouritesFor(HOSHI)).toEqual([]);
  });
});

describe("Order again (ORD-11)", () => {
  async function hoshiOrder() {
    const owner = { memberId: HOSHI };
    await addLine(owner, { ...oatLatte(), quantity: 2, note: "less ice" });
    await addLine(owner, {
      menuItemId: items["ube-pandesal"],
      optionIds: [],
      quantity: 1,
      note: "",
    });
    const result = await placeOrder({
      owner,
      memberId: HOSHI,
      seenTotalCents: (await getCart(owner)).totalCents,
      customerName: "Hoshi",
      customerEmail: "hoshi@hoshikopi.example",
      customerPhone: "",
      pickup: { kind: "asap" },
      paymentMethod: "pay_at_pickup",
    });
    if (!result.ok) throw new Error(result.reason);
    return result.orderId;
  }

  it("puts a past Order's Lines back in the Cart with their Options", async () => {
    const orderId = await hoshiOrder();

    expect(await orderAgain(orderId, HOSHI)).toEqual({
      added: 2,
      skipped: [],
    });
    const cart = await getCart({ memberId: HOSHI });
    expect(
      cart.lines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        note: line.note,
        options: line.options.map((option) => option.name),
      }))
    ).toEqual([
      {
        name: "Hoshi Latte",
        quantity: 2,
        note: "less ice",
        options: ["Large", "Oat milk", "50%", "Normal"],
      },
      { name: "Ube Pandesal", quantity: 1, note: "", options: [] },
    ]);
    expect(cart.totalCents).toBe(2 * 25000 + 7500);
  });

  it("leaves out what is Sold Out today and names it", async () => {
    const orderId = await hoshiOrder();
    await db.menuItem.update({
      where: { id: items["ube-pandesal"] },
      data: { soldOutOn: new Date("2026-11-02") },
    });

    expect(await orderAgain(orderId, HOSHI)).toEqual({
      added: 1,
      skipped: ["Ube Pandesal"],
    });
  });

  it("is only for the Member who placed the Order", async () => {
    const orderId = await hoshiOrder();
    expect(await orderAgain(orderId, "seed-manager")).toBeNull();
    expect((await getCart({ memberId: "seed-manager" })).lines).toEqual([]);
  });
});
