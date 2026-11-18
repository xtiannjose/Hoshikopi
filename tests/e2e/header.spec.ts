import { expect, test } from "@playwright/test";

import { openAllDayToday } from "./db";
import { signIn } from "./sign-in";

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

// The Staff header scrolled away too, and its logo left Staff for the
// customer site (owner, 2026-11-18, batch 12.6).
test("the Staff header stays on screen, its logo goes to Manage and a button to the site", async ({
  page,
}) => {
  await signIn(page, "annika@hoshikopi.example", "/manage/menu");
  // The menu streams in after the header; scroll once it is there.
  await expect(
    page.getByRole("heading", { name: "Option Groups", level: 2 })
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(400);
  expect((await page.locator("header.site-header").boundingBox())?.y).toBe(0);
  const back = page.getByRole("link", { name: "Back to the site" });
  await expect(back).toBeInViewport();
  await expect(back).toHaveAttribute("href", "/");

  await page.getByRole("link", { name: "Hoshikopi Staff" }).click();
  await expect(page).toHaveURL(/\/manage$/);
  await back.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("link", { name: "Hoshikopi home" })
  ).toBeVisible();
});
