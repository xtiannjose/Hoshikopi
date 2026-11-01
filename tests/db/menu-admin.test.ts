import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import {
  saveMenuItem,
  saveOption,
  setMenuItemSoldOut,
  type MenuItemInput,
} from "@/modules/menu";

import { seedDatabase } from "../../prisma/seed-data";
import { createTestDb, resetDb } from "./helpers";

const db = createTestDb();
const christian = {
  id: "seed-manager",
  name: "Christian",
  role: "manager" as const,
};

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

const latteInput = (change: Partial<MenuItemInput> = {}) =>
  itemInput("hoshi-latte", change);

async function itemInput(slug: string, change: Partial<MenuItemInput> = {}) {
  const latte = await db.menuItem.findUniqueOrThrow({
    where: { slug },
    include: { optionGroups: true },
  });
  return {
    id: latte.id,
    input: {
      categoryId: latte.categoryId,
      name: latte.name,
      slug: latte.slug,
      description: latte.description,
      basePrice: String(latte.baseCents / 100),
      isDrink: latte.isDrink ? "on" : undefined,
      isHidden: undefined,
      badges: latte.badges,
      allergens: latte.allergens,
      optionGroupIds: latte.optionGroups.map((g) => g.optionGroupId),
      photoAlt: latte.photoAlt ?? "",
      sort: String(latte.sort),
      ...change,
    } as MenuItemInput,
  };
}

describe("Sold Out", () => {
  it("marks a Menu Item Sold Out for today's Manila service day", async () => {
    // 1 AM Tuesday in Manila is still Monday in UTC.
    freezeClock("2026-11-02T17:00:00Z");
    const { id } = await latteInput();
    await setMenuItemSoldOut(id, true, christian);
    const item = await db.menuItem.findUniqueOrThrow({ where: { id } });
    expect(item.soldOutOn?.toISOString().slice(0, 10)).toBe("2026-11-03");
    expect(
      await db.auditLog.count({ where: { action: "menu.item.sold_out" } })
    ).toBe(1);
    await setMenuItemSoldOut(id, false, christian);
    expect(
      (await db.menuItem.findUniqueOrThrow({ where: { id } })).soldOutOn
    ).toBeNull();
  });
});

describe("saveMenuItem", () => {
  it("changes the Base Price in centavos and keeps the Option Groups", async () => {
    const { id, input } = await latteInput({ basePrice: "195.50" });
    expect(await saveMenuItem(id, input, christian)).toEqual({ ok: true, id });
    const item = await db.menuItem.findUniqueOrThrow({
      where: { id },
      include: { optionGroups: true },
    });
    expect(item.baseCents).toBe(19550);
    expect(item.optionGroups).toHaveLength(6);
  });

  it("refuses a negative or unclear price", async () => {
    const { id, input } = await latteInput({ basePrice: "-5" });
    const result = await saveMenuItem(id, input, christian);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.basePrice).toMatch(/pesos/);
  });

  it("refuses a slug another Menu Item uses", async () => {
    const { id, input } = await latteInput({ slug: "spanish-latte" });
    expect(await saveMenuItem(id, input, christian)).toEqual({
      ok: false,
      errors: { slug: "Another Menu Item uses this." },
    });
  });
});

describe("Barista Picks and Pairings (INFO-13, MENU-08)", () => {
  it("allows three Barista Picks per palette", async () => {
    // The seed picks three for Day and three for Night.
    const coldBrew = await itemInput("cold-brew", {
      badges: ["barista_pick"],
    });
    expect(await saveMenuItem(coldBrew.id, coldBrew.input, christian)).toEqual({
      ok: false,
      errors: {
        badges: "Three Day Barista Picks already. Untick one of them first.",
      },
    });
    const night = await itemInput("cold-brew", { badges: ["night_pick"] });
    expect((await saveMenuItem(night.id, night.input, christian)).ok).toBe(
      false
    );
    // An item already picked saves as before.
    const { id, input } = await latteInput();
    expect(await saveMenuItem(id, input, christian)).toEqual({ ok: true, id });
  });

  it("sets a Pairing, keeps it when the field is absent, never itself", async () => {
    const croissant = await db.menuItem.findUniqueOrThrow({
      where: { slug: "butter-croissant" },
    });
    const { id, input } = await latteInput({ pairingId: croissant.id });
    expect(await saveMenuItem(id, input, christian)).toEqual({ ok: true, id });
    const without = await latteInput();
    await saveMenuItem(id, without.input, christian);
    expect(
      (await db.menuItem.findUniqueOrThrow({ where: { id } })).pairingId
    ).toBe(croissant.id);
    expect(
      await saveMenuItem(id, { ...input, pairingId: id }, christian)
    ).toEqual({
      ok: false,
      errors: { pairingId: "Choose a different Menu Item." },
    });
  });
});

describe("Calorie estimates (MENU-10)", () => {
  it("saves whole kcal, clears on empty, keeps when absent", async () => {
    const { id, input } = await latteInput({ calories: "275" });
    expect(await saveMenuItem(id, input, christian)).toEqual({ ok: true, id });
    const kcal = async () =>
      (await db.menuItem.findUniqueOrThrow({ where: { id } })).calorieKcal;
    expect(await kcal()).toBe(275);
    await saveMenuItem(id, (await latteInput()).input, christian);
    expect(await kcal()).toBe(275);
    await saveMenuItem(
      id,
      (await latteInput({ calories: "" })).input,
      christian
    );
    expect(await kcal()).toBeNull();
    expect(
      await saveMenuItem(
        id,
        (await latteInput({ calories: "2.5" })).input,
        christian
      )
    ).toEqual({
      ok: false,
      errors: {
        calories: "Enter a whole number of kcal up to 3000, or leave it empty.",
      },
    });
  });
});

describe("saveOption", () => {
  it("keeps one default in a single-choice Option Group", async () => {
    const milk = await db.optionGroup.findFirstOrThrow({
      where: { name: "Milk" },
      include: { options: true },
    });
    const oat = milk.options.find((o) => o.name === "Oat milk")!;
    await saveOption(
      oat.id,
      {
        optionGroupId: milk.id,
        name: "Oat milk",
        priceDelta: "35",
        isDefault: "on",
        addsAllergens: [],
        sort: String(oat.sort),
      },
      christian
    );
    const defaults = await db.option.findMany({
      where: { optionGroupId: milk.id, isDefault: true },
    });
    expect(defaults.map((o) => o.name)).toEqual(["Oat milk"]);
  });
});
