import { describe, expect, it } from "vitest";

import { oneTapOptions, type OptionGroupView } from "./queries";

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
