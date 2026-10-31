import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, openIn } from "./axe";

for (const palette of ["day", "night"] as const) {
  test(`the menu in the ${palette} palette lists Categories with prices`, async ({
    page,
  }) => {
    await openIn(page, palette, "/menu");
    await expect(
      page.getByRole("heading", { name: "Coffee", exact: true })
    ).toBeVisible();
    const latte = page.getByRole("article").filter({ hasText: "Hoshi Latte" });
    await expect(latte).toContainText("PHP 185");
    await expect(latte).toContainText("Barista Pick");
    await expect(
      page.getByText("Order here for pickup at the counter.")
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test(`a Menu Item in the ${palette} palette shows Options and Allergens`, async ({
    page,
  }) => {
    await openIn(page, palette, "/menu/item/hoshi-latte");
    await expect(
      page.getByRole("heading", { level: 1, name: "Hoshi Latte" })
    ).toBeVisible();
    await expect(
      page.getByText("Contains: milk. Almond milk adds tree nuts.")
    ).toBeVisible();
    await expect(page.getByRole("group", { name: "Milk" })).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

test("picking Options updates the running price", async ({ page }) => {
  await page.goto("/menu/item/hoshi-latte");
  const price = page.getByText("Your Hoshi Latte:");
  await expect(price).toContainText("PHP 185");
  await page.getByText("Oat milk", { exact: true }).click();
  await page.getByText("Large", { exact: true }).click();
  await expect(price).toContainText("PHP 250");
});

test("a Category page and a nut badge", async ({ page }) => {
  await page.goto("/menu/pastries");
  await expect(
    page.getByRole("heading", { level: 1, name: "Pastries" })
  ).toBeVisible();
  await expect(
    page.getByRole("article").filter({ hasText: "Banana Bread" })
  ).toContainText("Contains nuts");
  await page.getByRole("link", { name: "Ube Pandesal" }).click();
  await expect(page).toHaveURL(/\/menu\/item\/ube-pandesal$/);
});

test("an unknown Menu Item is not found", async ({ page }) => {
  await page.goto("/menu/item/no-such-drink");
  await expect(page.getByText("This page could not be found")).toBeVisible();
});
