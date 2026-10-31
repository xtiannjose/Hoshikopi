import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, openIn } from "./axe";

test("a Guest adds customized drinks and the Cart merges and prices them", async ({
  page,
}) => {
  await page.goto("/menu/item/hoshi-latte");
  await page.getByText("Oat milk", { exact: true }).click();
  await page.getByText("Large", { exact: true }).click();
  await page.getByRole("button", { name: "One more" }).click();
  await expect(page.getByText("Your Hoshi Latte:")).toContainText("PHP 500");
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added to your order");
  await expect(page.getByRole("link", { name: /Cart 2 items/ })).toBeVisible();

  // The same choices again merge into the same Line.
  await page.getByText("Oat milk", { exact: true }).click();
  await page.getByText("Large", { exact: true }).click();
  await page.getByRole("button", { name: "One less" }).click();
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("link", { name: /Cart 3 items/ })).toBeVisible();

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Hoshi Latte" })).toHaveCount(
    1
  );
  await expect(page.getByText("Large, Oat milk, 100%, Normal")).toBeVisible();
  await expect(page.getByText("PHP 750").first()).toBeVisible();
  await page.getByRole("button", { name: "One less" }).click();
  await expect(page.getByText("PHP 500").first()).toBeVisible();
  await page.getByRole("button", { name: "Remove Hoshi Latte" }).click();
  await expect(page.getByText("Your Cart is empty.")).toBeVisible();
});

for (const palette of ["day", "night"] as const) {
  test(`the Cart in the ${palette} palette has no axe violations`, async ({
    page,
  }) => {
    await page.goto("/menu/item/ube-pandesal");
    await page.getByRole("button", { name: "Add to order" }).click();
    await expect(page.getByRole("status")).toContainText("Added");
    await openIn(page, palette, "/cart");
    await expect(page.getByText("PHP 75").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Check out" })).toBeVisible();
    await expectNoAxeViolations(page);
  });
}
