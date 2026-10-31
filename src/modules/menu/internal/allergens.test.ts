import { describe, expect, it } from "vitest";

import { allergenLine } from "./allergens";

const milkGroup = {
  name: "Milk",
  options: [
    { name: "Whole milk", addsAllergens: [] },
    { name: "Almond milk", addsAllergens: ["tree_nuts"] },
  ],
};
const addOns = {
  name: "Add-ons",
  options: [{ name: "Sea-salt cream", addsAllergens: ["milk"] }],
};

describe("allergenLine (MENU-07)", () => {
  it("lists what a Menu Item contains and what Options add", () => {
    expect(allergenLine(["milk"], [milkGroup, addOns])).toBe(
      "Contains: milk. Almond milk adds tree nuts."
    );
  });

  it("joins several allergens", () => {
    expect(allergenLine(["wheat", "milk", "egg"], [])).toBe(
      "Contains: wheat, milk and egg."
    );
  });

  it("says when there are none, and still names what Options add", () => {
    expect(allergenLine([], [])).toBe("No common allergens.");
    expect(allergenLine([], [addOns])).toBe(
      "No common allergens. Sea-salt cream adds milk."
    );
  });
});
