import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import { priceChoices } from "@/modules/menu";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const ids: Record<string, string> = {};
const items: Record<string, string> = {};

beforeAll(async () => {
  await resetDb(db);
  await seedDatabase(db, { people: false });
  for (const option of await db.option.findMany()) ids[option.name] = option.id;
  for (const item of await db.menuItem.findMany()) items[item.slug] = item.id;
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

const latte = (...names: string[]) => ({
  menuItemId: items["hoshi-latte"],
  optionIds: names.map((name) => ids[name]),
});
const REGULAR = ["Regular", "Whole milk", "100%", "Normal"];

describe("priceChoices: the server prices every Line (ORD-06)", () => {
  it("adds each chosen Option's Price Delta to the Base Price", async () => {
    const [priced] = await priceChoices([
      latte("Large", "Oat milk", "50%", "Normal", "1 extra shot"),
    ]);
    // 185 + 30 + 35 + 35
    expect(priced).toMatchObject({ ok: true, unitCents: 28500, isDrink: true });
  });

  it("prices a Menu Item with no Option Groups at its Base Price", async () => {
    const [priced] = await priceChoices([
      { menuItemId: items["ube-pandesal"], optionIds: [] },
    ]);
    expect(priced).toMatchObject({ ok: true, unitCents: 7500, isDrink: false });
  });

  it("snapshots names and Options for the Order", async () => {
    const [priced] = await priceChoices([latte(...REGULAR)]);
    expect(
      priced.ok && priced.options.map((o) => `${o.group}: ${o.name}`)
    ).toEqual([
      "Size: Regular",
      "Milk: Whole milk",
      "Sugar Level: 100%",
      "Ice Level: Normal",
    ]);
  });

  it("refuses a choice missing a required Option Group", async () => {
    const [priced] = await priceChoices([
      latte("Whole milk", "100%", "Normal"),
    ]);
    expect(priced).toEqual({ ok: false, reason: "invalid_options" });
  });

  it("refuses two picks in a single-choice group", async () => {
    const [priced] = await priceChoices([
      latte("Regular", "Large", "Whole milk", "100%", "Normal"),
    ]);
    expect(priced).toEqual({ ok: false, reason: "invalid_options" });
  });

  it("refuses an Option the Menu Item does not offer", async () => {
    const [priced] = await priceChoices([
      { menuItemId: items["ube-pandesal"], optionIds: [ids["Sago"]] },
    ]);
    expect(priced).toEqual({ ok: false, reason: "invalid_options" });
  });

  it("refuses Sold Out Menu Items and Options for today", async () => {
    freezeClock("2026-11-02T02:00:00Z");
    await db.option.update({
      where: { id: ids["Oat milk"] },
      data: { soldOutOn: new Date("2026-11-02") },
    });
    await db.menuItem.update({
      where: { id: items["ensaymada"] },
      data: { soldOutOn: new Date("2026-11-02") },
    });
    const [oat, ensaymada] = await priceChoices([
      latte("Regular", "Oat milk", "100%", "Normal"),
      { menuItemId: items["ensaymada"], optionIds: [] },
    ]);
    expect(oat).toEqual({ ok: false, reason: "option_sold_out" });
    expect(ensaymada).toEqual({ ok: false, reason: "sold_out" });
  });

  it("refuses Hidden and unknown Menu Items", async () => {
    await db.menuItem.update({
      where: { id: items["cold-brew"] },
      data: { isHidden: true },
    });
    const [hidden, unknown] = await priceChoices([
      { menuItemId: items["cold-brew"], optionIds: [] },
      { menuItemId: "no-such-item", optionIds: [] },
    ]);
    expect(hidden).toEqual({ ok: false, reason: "unavailable" });
    expect(unknown).toEqual({ ok: false, reason: "unavailable" });
  });
});
