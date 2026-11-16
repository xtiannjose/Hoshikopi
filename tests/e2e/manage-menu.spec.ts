import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { signIn } from "./sign-in";

// These change shared menu rows, so they run in one project only, one at a
// time: two saves a moment apart can race a cache refill (docs/03 section 4).
// The @cafe-wide ones run in their own project after the others, since
// other specs order these items (playwright.config.ts).
test.describe.configure({ mode: "serial" });
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name === "phone", "desktop task");
  test.setTimeout(240_000);
});

/**
 * A Staff change shows on the public menu within seconds (MENU-04). The
 * first visit after a change may get the old page while Next renders the
 * new one, so look again, but only for 20 seconds: the menu readers
 * revalidate every 10 (audit staff:2, tests:12; it once took 2 minutes).
 */
async function expectOnMenu(
  page: Page,
  path: string,
  item: string,
  text: string
) {
  await expect(async () => {
    await page.goto(path);
    await expect(
      page.getByRole("article").filter({ hasText: item })
    ).toContainText(text, { timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
}

test(
  "a Manager changes a price and the public menu shows it",
  {
    tag: "@cafe-wide",
  },
  async ({ page }) => {
    await signIn(page, "christian@hoshikopi.example", "/manage/menu");
    await expectNoAxeViolations(page);
    await page.getByRole("link", { name: "Spanish Latte" }).click();
    await page.getByLabel("Base Price (PHP)").fill("170");
    await page.getByRole("button", { name: "Save Menu Item" }).click();
    await expect(page.getByRole("status")).toContainText("Saved.");
    await expectNoAxeViolations(page);
    await expectOnMenu(page, "/menu", "Spanish Latte", "PHP 170");
  }
);

test(
  "a Barista marks a Menu Item Sold Out and back",
  {
    tag: "@cafe-wide",
  },
  async ({ page }) => {
    await signIn(page, "annika@hoshikopi.example", "/manage/menu");
    await page.getByRole("button", { name: "Sold out for Ensaymada" }).click();
    await expect(
      page.getByRole("button", { name: "Back on for Ensaymada" })
    ).toBeVisible();
    await expectOnMenu(page, "/menu/pastries", "Ensaymada", "Sold out today");

    await page.goto("/manage/menu");
    await page.getByRole("button", { name: "Back on for Ensaymada" }).click();
    await expect(
      page.getByRole("button", { name: "Sold out for Ensaymada" })
    ).toBeVisible();
    await expectOnMenu(page, "/menu/pastries", "Ensaymada", "PHP 95");
  }
);

test("a Barista cannot edit a Menu Item", async ({ page }) => {
  await signIn(page, "annika@hoshikopi.example", "/manage/menu");
  await expect(page.getByRole("link", { name: "Add a Menu Item" })).toHaveCount(
    0
  );
  await page.goto("/manage/menu/item/new");
  await expect(
    page.getByRole("heading", { name: /could not be found/i })
  ).toBeVisible();
});
