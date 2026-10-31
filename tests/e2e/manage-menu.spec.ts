import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { signIn } from "./sign-in";

// These change shared menu rows, so they run in one project only, one at a
// time: two saves a moment apart can race a cache refill (docs/03 section 4).
test.describe.configure({ mode: "serial" });
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  test.setTimeout(240_000);
});

/**
 * A Staff change shows on the public menu within seconds (MENU-04). The
 * first visit after a change may get the old page while Next renders the
 * new one, and a save under another tag at the same moment can delay it
 * until the one-minute lifetime runs out, so look again until it shows.
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
  }).toPass({ timeout: 150_000 });
}

test("a Manager changes a price and the public menu shows it", async ({
  page,
}) => {
  await signIn(page, "kai@hoshikopi.example", "/manage/menu");
  await expectNoAxeViolations(page);
  await page.getByRole("link", { name: "Spanish Latte" }).click();
  await page.getByLabel("Base Price (PHP)").fill("170");
  await page.getByRole("button", { name: "Save Menu Item" }).click();
  await expect(page.getByRole("status")).toContainText("Saved.");
  await expectNoAxeViolations(page);
  await expectOnMenu(page, "/menu", "Spanish Latte", "PHP 170");
});

test("a Barista marks a Menu Item Sold Out and back", async ({ page }) => {
  await signIn(page, "jomar@hoshikopi.example", "/manage/menu");
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
});

test("a Barista cannot edit a Menu Item", async ({ page }) => {
  await signIn(page, "jomar@hoshikopi.example", "/manage/menu");
  await expect(page.getByRole("link", { name: "Add a Menu Item" })).toHaveCount(
    0
  );
  await page.goto("/manage/menu/item/new");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});
