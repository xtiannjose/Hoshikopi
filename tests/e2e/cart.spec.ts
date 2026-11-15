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
  // The Cart count bumps when it goes up, never on page load (docs/05 s7).
  const bump = page.getByRole("banner").locator(".animate-bump");
  await expect(bump).toHaveCount(0);
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added to your order");
  await expect(page.getByRole("link", { name: /Cart 2 items/ })).toBeVisible();
  await expect(bump).toHaveCount(1);

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

// Options change in the Cart, not only the quantity (PRD ORD-02, audit
// journeys:14).
test("a Line's Options, quantity and note change in the Cart", async ({
  page,
}) => {
  await page.goto("/menu/item/hoshi-latte");
  await page.getByText("Oat milk", { exact: true }).click();
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added");

  await page.goto("/cart");
  await page.getByRole("link", { name: "Change Hoshi Latte" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Change your Hoshi Latte" })
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: /Oat milk/ })).toBeChecked();
  await page.getByText("Whole milk", { exact: true }).click();
  await page.getByText("Large", { exact: true }).click();
  await page.getByRole("button", { name: "One more" }).click();
  await page
    .getByRole("textbox", { name: /Note for the barista/ })
    .fill("less ice please");
  await page.getByRole("button", { name: "Update order" }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("heading", { name: "Hoshi Latte" })).toHaveCount(
    1
  );
  await expect(page.getByText("Large, Whole milk, 100%, Normal")).toBeVisible();
  await expect(page.getByText("less ice please")).toBeVisible();
  await expect(page.getByRole("link", { name: /Cart 2 items/ })).toBeVisible();
  await expectNoAxeViolations(page);
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

test("the floating Cart opens a drawer and leads to checkout (8.2)", async ({
  page,
}) => {
  await page.goto("/menu/item/kopi-hitam");
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added");
  // On a phone the Menu Item's own Add to order bar holds that spot (8.3).
  await page.goto("/menu");
  const pill = page.getByRole("button", { name: /Your Cart/ });
  await expect(pill).toContainText("PHP");
  await pill.click();
  const drawer = page.getByRole("dialog", { name: "Your Cart" });
  await expect(drawer).toContainText("1 x Kopi Hitam");
  await expectNoAxeViolations(page);
  await drawer.getByRole("link", { name: "Check out" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(drawer).toBeHidden();
  await expect(pill).toHaveCount(0);
});
