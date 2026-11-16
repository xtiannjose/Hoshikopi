import { del, put } from "@vercel/blob";
import sharp from "sharp";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { freezeClock, unfreezeClock } from "@/lib/clock";
import {
  deleteOptionGroup,
  priceChoices,
  saveMenuItem,
  saveMenuItemWithPhoto,
  saveOption,
  saveOptionGroup,
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
afterEach(() => {
  unfreezeClock();
  vi.unstubAllEnvs();
});

vi.mock("@vercel/blob", () => ({ put: vi.fn(), del: vi.fn() }));
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

  // The column holds up to PHP 21 million, so a bigger price gave a 500
  // and lost the form (audit staff:6).
  it("refuses a price over PHP 100,000 in plain words", async () => {
    const { id, input } = await latteInput({ basePrice: "100001" });
    const result = await saveMenuItem(id, input, christian);
    expect(!result.ok && result.errors.basePrice).toBe(
      "Use PHP 100,000 or less."
    );
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
  // A Seasonal item past its date still held its pick, so Home showed two
  // and the Manager was told the slots were full (audit staff:20).
  it("does not count a pick whose Seasonal date has passed", async () => {
    const [first] = await db.menuItem.findMany({
      where: { badges: { has: "barista_pick" } },
      orderBy: { name: "asc" },
    });
    await db.menuItem.update({
      where: { id: first.id },
      data: { availableUntil: new Date("2026-11-01") },
    });
    const coldBrew = await itemInput("cold-brew", {
      badges: ["barista_pick"],
    });
    expect(
      (await saveMenuItem(coldBrew.id, coldBrew.input, christian)).ok
    ).toBe(true);
  });

  it("allows three Barista Picks per palette", async () => {
    // The seed picks three for Day and three for Night.
    const coldBrew = await itemInput("cold-brew", {
      badges: ["barista_pick"],
    });
    // It names the three, so the Manager knows which to untick (audit
    // staff:20).
    const picks = (
      await db.menuItem.findMany({
        where: { badges: { has: "barista_pick" } },
        orderBy: { name: "asc" },
        select: { name: true },
      })
    ).map((item) => item.name);
    const [a, b, c] = picks;
    expect(await saveMenuItem(coldBrew.id, coldBrew.input, christian)).toEqual({
      ok: false,
      errors: {
        badges: `Three Day Barista Picks already: ${a}, ${b} and ${c}. Untick one of them first.`,
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
        isHidden: undefined,
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

  // A mistyped or discontinued Option stayed on every Menu Item that used
  // its group (audit staff:9).
  it("hides an Option, and a Hidden Option is never priced", async () => {
    const latte = await db.menuItem.findUniqueOrThrow({
      where: { slug: "hoshi-latte" },
      include: {
        optionGroups: {
          include: { optionGroup: { include: { options: true } } },
        },
      },
    });
    const milk = latte.optionGroups.find(
      (g) => g.optionGroup.name === "Milk"
    )!.optionGroup;
    const oat = milk.options.find((o) => o.name === "Oat milk")!;
    const optionIds = latte.optionGroups.flatMap(({ optionGroup }) =>
      optionGroup.id === milk.id
        ? [oat.id]
        : optionGroup.options
            .filter((o) => o.isDefault)
            .slice(0, Math.max(optionGroup.minSelect, 1))
            .map((o) => o.id)
    );
    const choice = { menuItemId: latte.id, optionIds };
    expect((await priceChoices([choice]))[0].ok).toBe(true);
    await saveOption(
      oat.id,
      {
        optionGroupId: milk.id,
        name: oat.name,
        priceDelta: String(oat.deltaCents / 100),
        isDefault: undefined,
        isHidden: "on",
        addsAllergens: oat.addsAllergens as never,
        sort: String(oat.sort),
      },
      christian
    );
    expect(await priceChoices([choice])).toEqual([
      { ok: false, reason: "invalid_options" },
    ]);
  });
});

describe("deleteOptionGroup (audit staff:9)", () => {
  it("deletes an Option Group no Menu Item offers, never one in use", async () => {
    const milk = await db.optionGroup.findFirstOrThrow({
      where: { name: "Milk" },
    });
    expect(await deleteOptionGroup(milk.id, christian)).toBe(false);
    expect(await db.optionGroup.count({ where: { id: milk.id } })).toBe(1);

    const added = await saveOptionGroup(
      null,
      { name: "Test group", minSelect: "0", maxSelect: "1" },
      christian
    );
    if (!added.ok) throw new Error("not saved");
    expect(await deleteOptionGroup(added.id, christian)).toBe(true);
    expect(await db.optionGroup.count({ where: { id: added.id } })).toBe(0);
    expect(
      await db.auditLog.count({
        where: { action: "menu.option_group.delete", targetId: added.id },
      })
    ).toBe(1);
  });
});

// A photo was uploaded before the form was checked, kept its EXIF, and the
// one it replaced stayed in the public store (audit ops:15).
describe("menu photos", () => {
  it("uploads only after the save passes, and deletes the photo it replaces", async () => {
    vi.stubEnv("BLOB_STORE_ID", "store_test");
    vi.mocked(put).mockImplementation(
      async (pathname) =>
        ({
          url: `https://store.public.blob.vercel-storage.com/${pathname}`,
        }) as Awaited<ReturnType<typeof put>>
    );
    const photo = new File(
      [
        await sharp({
          create: { width: 2, height: 2, channels: 3, background: "#e7a83f" },
        })
          .png()
          .toBuffer(),
      ],
      "latte.png"
    );
    const refused = await latteInput({ basePrice: "-1" });
    expect(
      (await saveMenuItemWithPhoto(refused.id, refused.input, christian, photo))
        .ok
    ).toBe(false);
    expect(put).not.toHaveBeenCalled();

    const old = "https://store.public.blob.vercel-storage.com/menu/old.png";
    await db.menuItem.update({
      where: { id: refused.id },
      data: { photoUrl: old },
    });
    const { id, input } = await latteInput();
    expect((await saveMenuItemWithPhoto(id, input, christian, photo)).ok).toBe(
      true
    );
    expect(put).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith(old);
    expect(
      (await db.menuItem.findUniqueOrThrow({ where: { id } })).photoUrl
    ).toMatch(/\/menu\/hoshi-latte-\d+\.png$/);
  });
});
