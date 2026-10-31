import { expect, test } from "@playwright/test";

import { openAllDayToday } from "./db";

const PAGES = [
  "/",
  "/menu",
  "/menu/item/hoshi-latte",
  "/cafe",
  "/events",
  "/news",
  "/concept",
  "/cart",
  "/checkout",
  "/sign-in",
];

test.describe("budgets (docs/05 section 11)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "phone", "measured once, on a phone");
  });

  for (const path of PAGES.slice(0, 7)) {
    test(`${path} loads under 170 kB of JavaScript`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      const bytes = await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .filter(
            (r) => (r as PerformanceResourceTiming).initiatorType === "script"
          )
          .reduce(
            (sum, r) => sum + (r as PerformanceResourceTiming).encodedBodySize,
            0
          )
      );
      expect(bytes).toBeLessThan(170_000);
    });
  }
});

test.describe("reflow at 320 px (WCAG 1.4.10)", () => {
  test.use({ viewport: { width: 320, height: 640 } });
  test.beforeEach(openAllDayToday);

  for (const path of PAGES) {
    test(`${path} has no sideways scrolling`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "phone", "once is enough");
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test("the header fits 320 px with items in the Cart", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "once is enough");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/menu/item/hoshi-latte");
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("link", { name: /Cart 1 item/ })).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the skip link and a keyboard-only order", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a keyboard user on desktop");
  await openAllDayToday();
  await page.goto("/menu/item/hoshi-latte");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" })
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  // Arrow keys move within a radio group; Tab moves between groups.
  const regular = page.getByRole("radio", { name: /Regular/ });
  await regular.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Large/ })).toBeChecked();
  await page.getByRole("button", { name: "Add to order" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Added");
});
