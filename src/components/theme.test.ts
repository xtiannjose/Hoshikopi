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

// Loads the script at 17:59:30 Manila with a running clock (audit motion:9).
function loadAtTurn(page: {
  visibilityState?: string;
  startViewTransition?: (update: () => void) => void;
}) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-02T09:59:30Z"));
  const dataset: { theme?: string } = {};
  const storage = { pinned: null as string | null };
  const win: { hoshikopiTheme?: () => void } = {};
  new Function("document", "window", "localStorage", THEME_SCRIPT)(
    { documentElement: { dataset }, ...page },
    win,
    { getItem: () => storage.pinned }
  );
  return { dataset, storage, win };
}

describe("THEME_SCRIPT at 6:00 and 18:00 on an open page (audit motion:9)", () => {
  it("crossfades the turn to Night once", () => {
    const startViewTransition = vi.fn((update: () => void) => update());
    const { dataset } = loadAtTurn({
      visibilityState: "visible",
      startViewTransition,
    });
    expect(dataset.theme).toBe("day");
    expect(startViewTransition).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    expect(dataset.theme).toBe("night");
    expect(startViewTransition).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(60_000);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
  });

  it("a hidden page switches at once", () => {
    const startViewTransition = vi.fn((update: () => void) => update());
    const { dataset } = loadAtTurn({
      visibilityState: "hidden",
      startViewTransition,
    });
    vi.advanceTimersByTime(60_000);
    expect(dataset.theme).toBe("night");
    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it("a browser without View Transitions switches at once", () => {
    const { dataset } = loadAtTurn({ visibilityState: "visible" });
    vi.advanceTimersByTime(60_000);
    expect(dataset.theme).toBe("night");
  });

  it("the header switch applies directly", () => {
    const startViewTransition = vi.fn((update: () => void) => update());
    const { dataset, storage, win } = loadAtTurn({
      visibilityState: "visible",
      startViewTransition,
    });
    storage.pinned = "night";
    win.hoshikopiTheme?.();
    expect(dataset.theme).toBe("night");
    expect(startViewTransition).not.toHaveBeenCalled();
  });
});
