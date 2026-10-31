import { describe, expect, it } from "vitest";

import {
  addMoney,
  formatDelta,
  formatPrice,
  formatReceipt,
  parsePesos,
  vatPart,
} from "./money";

describe("formatPrice (menu)", () => {
  it("drops zero centavos", () => {
    expect(formatPrice(16500)).toBe("PHP 165");
  });
  it("keeps centavos when there are some", () => {
    expect(formatPrice(16550)).toBe("PHP 165.50");
  });
  it("groups thousands", () => {
    expect(formatPrice(125000)).toBe("PHP 1,250");
  });
});

describe("formatDelta (Option chips)", () => {
  it("shows what an Option adds without the currency", () => {
    expect(formatDelta(3500)).toBe("+35");
    expect(formatDelta(3550)).toBe("+35.50");
  });
  it("is empty for a free Option", () => {
    expect(formatDelta(0)).toBe("");
  });
});

describe("formatReceipt", () => {
  it("always shows centavos", () => {
    expect(formatReceipt(16500)).toBe("PHP 165.00");
    expect(formatReceipt(5)).toBe("PHP 0.05");
  });
  it("shows a minus for refunds", () => {
    expect(formatReceipt(-16500)).toBe("-PHP 165.00");
  });
});

describe("vatPart", () => {
  it("is 12/112 of a VAT-inclusive total", () => {
    expect(vatPart(11200)).toBe(1200);
  });
  it("rounds half up once", () => {
    // 14 * 12 / 112 = 1.5 centavos
    expect(vatPart(14)).toBe(2);
    // 13 * 12 / 112 = 1.39 centavos
    expect(vatPart(13)).toBe(1);
  });
});

describe("guards", () => {
  it("refuses fractions of a centavo", () => {
    expect(() => formatPrice(165.5)).toThrow(RangeError);
    expect(() => addMoney(100, 0.1)).toThrow(RangeError);
  });
  it("adds centavos", () => {
    expect(addMoney(18500, 3500, 2000)).toBe(24000);
  });
});

describe("parsePesos (Staff forms)", () => {
  it("reads pesos as typed", () => {
    expect(parsePesos("185")).toBe(18500);
    expect(parsePesos(" 35.5 ")).toBe(3550);
    expect(parsePesos("PHP 1,250.00")).toBe(125000);
    expect(parsePesos("0")).toBe(0);
  });
  it("refuses anything unclear or negative", () => {
    for (const bad of ["", "abc", "-5", "1.234", "12,34", "1e3"]) {
      expect(parsePesos(bad)).toBeNull();
    }
  });
});
