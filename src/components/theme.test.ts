import { afterEach, describe, expect, it, vi } from "vitest";

import { THEME_SCRIPT } from "./theme";

// Runs the <head> script against stubs at a set time and returns the palette.
function themeAt(iso: string, pinned: string | null = null) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
  const dataset: { theme?: string } = {};
  new Function(
    "document",
    "localStorage",
    "window",
    "setInterval",
    THEME_SCRIPT
  )({ documentElement: { dataset } }, { getItem: () => pinned }, {}, () => 0);
  return dataset.theme;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("THEME_SCRIPT", () => {
  it("turns Day at 6:00 and Night at 18:00 Manila (audit tests:15)", () => {
    expect(themeAt("2026-11-06T21:59:00Z")).toBe("night");
    expect(themeAt("2026-11-06T22:00:00Z")).toBe("day");
    expect(themeAt("2026-11-07T09:59:00Z")).toBe("day");
    expect(themeAt("2026-11-07T10:00:00Z")).toBe("night");
  });

  it("a pinned palette wins", () => {
    expect(themeAt("2026-11-07T04:00:00Z", "night")).toBe("night");
  });
});
