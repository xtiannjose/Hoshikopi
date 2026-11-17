import { describe, expect, it } from "vitest";

import { filterTags, oneTapOptions, type OptionGroupView } from "./queries";

const option = (id: string, isDefault = false, soldOut = false) => ({
  id,
  name: id,
  deltaCents: 0,
  isDefault,
  soldOut,
});
const group = (
  options: ReturnType<typeof option>[],
  minSelect = 1,
  maxSelect = 1
): OptionGroupView => ({ id: "g", name: "g", minSelect, maxSelect, options });

describe("oneTapOptions (MENU-08)", () => {
  it("takes each group's defaults", () => {
    expect(
      oneTapOptions([
        group([option("regular", true), option("large")]),
        group([option("shot"), option("cream")], 0, 2),
      ])
    ).toEqual(["regular"]);
  });

  it("falls back to the first left when a required default is Sold Out", () => {
    expect(
      oneTapOptions([
        group([option("whole", true, true), option("oat"), option("almond")]),
      ])
    ).toEqual(["oat"]);
  });

  it("gives up when a required group has nothing left today", () => {
    expect(oneTapOptions([group([option("whole", true, true)])])).toBeNull();
  });
});

// Read from keys, not labels (audit architecture:17); merch gets none and
// only a drink is caffeine-free (audit journeys:22).
describe("filterTags (MENU-05)", () => {
  const drink = { isDrink: true, categorySlug: "coffee" };
  it("tags vegan, caffeine-free and nut-free from the keys", () => {
    expect(
      filterTags({
        ...drink,
        badges: ["vegan", "no_caffeine"],
        allergens: ["milk"],
      })
    ).toEqual(["vegan", "no-caffeine", "nut-free"]);
    expect(
      filterTags({
        ...drink,
        badges: ["best_seller"],
        allergens: ["tree_nuts"],
      })
    ).toEqual([]);
    expect(
      filterTags({ ...drink, badges: [], allergens: ["peanuts"] })
    ).not.toContain("nut-free");
  });

  it("gives beans and merch no tags, and food no caffeine tag", () => {
    expect(
      filterTags({
        badges: [],
        allergens: [],
        isDrink: false,
        categorySlug: "beans-and-merch",
      })
    ).toEqual([]);
    expect(
      filterTags({
        badges: ["no_caffeine"],
        allergens: [],
        isDrink: false,
        categorySlug: "pastries",
      })
    ).toEqual(["nut-free"]);
  });
});
