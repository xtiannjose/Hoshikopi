import { expect, test } from "@playwright/test";

import { openAllDayToday } from "./db";

test.beforeEach(openAllDayToday);

// The menu, account and Cart were a scroll away on a long page (owner,
// 2026-11-17): the header stays at the top, and the Category tabs stick
// just below it rather than under it.
test("the header stays on screen while a long page scrolls, with the Category tabs below it", async ({
  page,
}) => {
  await page.goto("/menu");
  const header = page.locator("header.site-header");
  const tabs = page.getByRole("navigation", { name: "Categories" });
  // Partway down the menu, where the tabs are stuck (at the very end the
  // menu has ended and its tabs scroll away with it).
  await page.evaluate(() => {
    const tabsTop = document
      .querySelector('nav[aria-label="Categories"]')!
      .getBoundingClientRect().top;
    window.scrollTo(0, window.scrollY + tabsTop + 600);
  });
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(400);
  const headerBox = await header.boundingBox();
  const tabsBox = await tabs.boundingBox();
  expect(headerBox?.y).toBe(0);
  expect(tabsBox!.y).toBeGreaterThanOrEqual(
    headerBox!.y + headerBox!.height - 1
  );
  await expect(
    page.getByRole("link", { name: "Hoshikopi home" })
  ).toBeInViewport();
});
