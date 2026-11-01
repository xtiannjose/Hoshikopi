import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { dayValue, freezeClock, unfreezeClock } from "@/lib/clock";
import { priceChoices, saveMenuItem, type MenuItemInput } from "@/modules/menu";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const ids: Record<string, string> = {};
const items: Record<string, string> = {};
const christian = {
  id: "seed-manager",
  name: "Christian",
  role: "manager" as const,
};

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db, { people: true });
  for (const option of await db.option.findMany()) ids[option.name] = option.id;
  for (const item of await db.menuItem.findMany()) items[item.slug] = item.id;
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

/** Ensaymada (PHP 95) at PHP 79 from Nov 1 to Nov 7, Manila days. */
const ensaymadaPromo = () =>
  db.menuItem.update({
    where: { slug: "ensaymada" },
    data: {
      promoCents: 7900,
      promoFrom: dayValue("2026-11-01"),
      promoUntil: dayValue("2026-11-07"),
    },
  });
const ensaymada = async () =>
  (await priceChoices([{ menuItemId: items.ensaymada, optionIds: [] }]))[0];

describe("Promos (MENU-06)", () => {
  it("replace the Base Price on their Manila days only", async () => {
    await ensaymadaPromo();
    freezeClock("2026-11-02T01:00:00Z");
    expect(await ensaymada()).toMatchObject({
      baseCents: 7900,
      unitCents: 7900,
    });
    freezeClock("2026-10-31T16:30:00Z"); // 12:30 AM, Nov 1 in Manila
    expect(await ensaymada()).toMatchObject({ unitCents: 7900 });
    freezeClock("2026-10-31T15:30:00Z"); // 11:30 PM, Oct 31 in Manila
    expect(await ensaymada()).toMatchObject({ unitCents: 9500 });
    freezeClock("2026-11-07T15:30:00Z"); // 11:30 PM, Nov 7: the last day
    expect(await ensaymada()).toMatchObject({ unitCents: 7900 });
    freezeClock("2026-11-07T16:30:00Z"); // 12:30 AM, Nov 8
    expect(await ensaymada()).toMatchObject({ unitCents: 9500 });
  });

  it("keep adding Price Deltas on top", async () => {
    await db.menuItem.update({
      where: { slug: "hoshi-latte" },
      data: {
        promoCents: 15000,
        promoFrom: dayValue("2026-11-01"),
        promoUntil: dayValue("2026-11-30"),
      },
    });
    freezeClock("2026-11-02T01:00:00Z");
    const [priced] = await priceChoices([
      {
        menuItemId: items["hoshi-latte"],
        optionIds: ["Large", "Oat milk", "100%", "Normal"].map((n) => ids[n]),
      },
    ]);
    // 150 + 30 + 35
    expect(priced).toMatchObject({ ok: true, unitCents: 21500 });
  });
});

describe("Seasonal Menu Items (MENU-06)", () => {
  it("leave the menu after their last Manila day", async () => {
    await db.menuItem.update({
      where: { slug: "ensaymada" },
      data: { availableUntil: dayValue("2026-11-02") },
    });
    freezeClock("2026-11-02T15:30:00Z"); // 11:30 PM, Nov 2
    expect(await ensaymada()).toMatchObject({ ok: true });
    freezeClock("2026-11-02T16:30:00Z"); // 12:30 AM, Nov 3
    expect(await ensaymada()).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("saveMenuItem: Promo and season fields", () => {
  async function ensaymadaInput(change: Partial<MenuItemInput>) {
    const row = await db.menuItem.findUniqueOrThrow({
      where: { slug: "ensaymada" },
    });
    return {
      id: row.id,
      input: {
        categoryId: row.categoryId,
        name: row.name,
        slug: row.slug,
        description: row.description,
        basePrice: "95",
        isDrink: undefined,
        isHidden: undefined,
        badges: row.badges,
        allergens: row.allergens,
        optionGroupIds: [],
        photoAlt: "",
        sort: String(row.sort),
        ...change,
      } as MenuItemInput,
    };
  }

  it("saves a Promo and a last day, and clears them", async () => {
    const { id, input } = await ensaymadaInput({
      promoPrice: "79",
      promoFrom: "2026-11-01",
      promoUntil: "2026-11-07",
      availableUntil: "2026-12-31",
    });
    expect(await saveMenuItem(id, input, christian)).toEqual({ ok: true, id });
    const saved = await db.menuItem.findUniqueOrThrow({ where: { id } });
    expect(saved).toMatchObject({
      promoCents: 7900,
      promoFrom: dayValue("2026-11-01"),
      promoUntil: dayValue("2026-11-07"),
      availableUntil: dayValue("2026-12-31"),
    });
    const cleared = await ensaymadaInput({
      promoPrice: "",
      promoFrom: "",
      promoUntil: "",
      availableUntil: "",
    });
    await saveMenuItem(id, cleared.input, christian);
    expect(
      await db.menuItem.findUniqueOrThrow({ where: { id } })
    ).toMatchObject({ promoCents: null, availableUntil: null });
  });

  it("refuses a Promo that is not lower, has no dates, or ends first", async () => {
    const save = async (change: Partial<MenuItemInput>) => {
      const { id, input } = await ensaymadaInput(change);
      return saveMenuItem(id, input, christian);
    };
    expect(
      await save({
        promoPrice: "95",
        promoFrom: "2026-11-01",
        promoUntil: "2026-11-07",
      })
    ).toMatchObject({
      ok: false,
      errors: { promoPrice: "A Promo price is lower than the Base Price." },
    });
    expect(
      await save({ promoPrice: "79", promoFrom: "", promoUntil: "" })
    ).toMatchObject({
      ok: false,
      errors: { promoFrom: "Choose the Promo's first and last days." },
    });
    expect(
      await save({
        promoPrice: "79",
        promoFrom: "2026-11-07",
        promoUntil: "2026-11-01",
      })
    ).toMatchObject({
      ok: false,
      errors: { promoUntil: "The last day is on or after the first." },
    });
  });
});
