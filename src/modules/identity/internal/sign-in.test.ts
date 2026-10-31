import { describe, expect, it } from "vitest";

import { safeNext } from "./sign-in";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/manage")).toBe("/manage");
    expect(safeNext("/orders/abc?t=1")).toBe("/orders/abc?t=1");
  });

  it("refuses other sites and tricks", () => {
    for (const next of [
      "https://evil.example",
      "//evil.example",
      "/\t/evil.example",
      "/\\evil.example",
      "",
      null,
    ]) {
      expect(safeNext(next)).toBe("/account");
    }
  });
});
