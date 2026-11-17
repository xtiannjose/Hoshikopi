import { describe, expect, it } from "vitest";

import { snapshotOptions } from "./snapshot";

// One reader for the Order Line's Options snapshot (audit architecture:20).
describe("snapshotOptions", () => {
  it("reads the Options an Order Line kept", () => {
    const kept = [
      { group: "Milk", name: "Oat milk", deltaCents: 3000 },
      { group: "Size", name: "Large", deltaCents: 2000 },
    ];
    expect(snapshotOptions(kept)).toEqual(kept);
  });

  it("a missing or non-array snapshot reads as no Options", () => {
    expect(snapshotOptions(null)).toEqual([]);
    expect(snapshotOptions({})).toEqual([]);
  });
});
