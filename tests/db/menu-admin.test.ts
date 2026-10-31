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
const kai = { id: "seed-manager", name: "Kai", role: "manager" as const };

beforeEach(async () => {
  await resetDb(db);
  await seedDatabase(db);
});
afterEach(unfreezeClock);
afterAll(() => db.$disconnect());

async function latteInput(change: Partial<MenuItemInput> = {}) {
  const latte = await db.menuItem.findUniqueOrThrow({
    where: { slug: "hoshi-latte" },
    include: { optionGroups: true },
  });
  return {
    id: latte.id,
    input: {
      categoryId: latte.categoryId,
      name: latte.name,
      slug: latte.slug,
      description: latte.description,
      basePrice: "185",
      isDrink: "on",
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
    await setMenuItemSoldOut(id, true, kai);
    const item = await db.menuItem.findUniqueOrThrow({ where: { id } });
    expect(item.soldOutOn?.toISOString().slice(0, 10)).toBe("2026-11-03");
    expect(
      await db.auditLog.count({ where: { action: "menu.item.sold_out" } })
    ).toBe(1);
    await setMenuItemSoldOut(id, false, kai);
    expect(
      (await db.menuItem.findUniqueOrThrow({ where: { id } })).soldOutOn
    ).toBeNull();
  });
});

describe("saveMenuItem", () => {
  it("changes the Base Price in centavos and keeps the Option Groups", async () => {
    const { id, input } = await latteInput({ basePrice: "195.50" });
    expect(await saveMenuItem(id, input, kai)).toEqual({ ok: true, id });
    const item = await db.menuItem.findUniqueOrThrow({
      where: { id },
      include: { optionGroups: true },
    });
    expect(item.baseCents).toBe(19550);
    expect(item.optionGroups).toHaveLength(6);
  });

  it("refuses a negative or unclear price", async () => {
    const { id, input } = await latteInput({ basePrice: "-5" });
    const result = await saveMenuItem(id, input, kai);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.basePrice).toMatch(/pesos/);
  });

  it("refuses a slug another Menu Item uses", async () => {
    const { id, input } = await latteInput({ slug: "spanish-latte" });
    expect(await saveMenuItem(id, input, kai)).toEqual({
      ok: false,
      errors: { slug: "Another Menu Item uses this." },
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
      kai
    );
    const defaults = await db.option.findMany({
      where: { optionGroupId: milk.id, isDefault: true },
    });
    expect(defaults.map((o) => o.name)).toEqual(["Oat milk"]);
  });
});
