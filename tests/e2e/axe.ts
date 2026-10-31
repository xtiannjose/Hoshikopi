import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** WCAG 2.2 A and AA, as every page test runs it (docs/03 section 15). */
export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

// 10:00 AM and 8:00 PM in Manila (UTC+8).
export const DAY_TIME = new Date("2026-11-02T02:00:00Z");
export const NIGHT_TIME = new Date("2026-11-02T12:00:00Z");

/** Opens `path` at a Manila time in the Day or Night palette. */
export async function openIn(
  page: Page,
  palette: "day" | "night",
  path: string
) {
  await page.clock.setFixedTime(palette === "day" ? DAY_TIME : NIGHT_TIME);
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-theme", palette);
}
