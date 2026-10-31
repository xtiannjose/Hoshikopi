import { expect, test, type Page } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { openAllDayToday } from "./db";

test.beforeEach(openAllDayToday);

async function addToCart(page: Page, slug: string, quantity = 1) {
  await page.goto(`/menu/item/${slug}`);
  for (let i = 1; i < quantity; i++) {
    await page.getByRole("button", { name: "One more" }).click();
  }
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added");
}

test("a Guest orders ahead and pays at pickup (ORD-03 to ORD-08)", async ({
  page,
}) => {
  await addToCart(page, "hoshi-latte");
  await addToCart(page, "ube-pandesal");
  await page.goto("/cart");
  await page.getByRole("link", { name: "Check out" }).click();
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(page.getByText("As soon as possible")).toBeVisible();
  await expect(
    page.getByText("Hoshikopi is a concept cafe.").first()
  ).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByLabel("Name").fill("Bea");
  await page.getByLabel("Email").fill("bea@example.com");
  await page.getByRole("button", { name: /Place order, PHP 260/ }).click();
  await expect(page).toHaveURL(/\/orders\/\w+\?t=/);
  await expect(
    page.getByText("Salamat, Bea! We're making your Hoshi Latte.")
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^K-\d{3}$/);
  // Next keeps the previous page hidden for Back, so look in this one.
  await expect(
    page
      .getByRole("region", { name: "Your order" })
      .getByText("Pay at the counter when you collect.")
  ).toBeVisible();
  await expectNoAxeViolations(page);

  // The Cart is empty after placing, in the header too.
  await expect(
    page.getByRole("link", { name: "Cart", exact: true })
  ).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByText("Your Cart is empty.")).toBeVisible();
});

test("checkout asks for an email or a mobile number", async ({ page }) => {
  await addToCart(page, "kopi-hitam");
  await page.goto("/checkout");
  await page.getByLabel("Name").fill("Migs");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(
    page.getByText("Give us an email or a mobile number for your Order.")
  ).toBeVisible();
});

test("a Guest can't pay at pickup for more than 4 drinks (PAY-02)", async ({
  page,
}) => {
  await addToCart(page, "kopi-hitam", 5);
  await page.goto("/checkout");
  await expect(
    page.getByText("Guests can pay at pickup for up to 4 drinks.")
  ).toBeVisible();
});

test("an Order page needs its link token", async ({ page }) => {
  await addToCart(page, "kopi-hitam");
  await page.goto("/checkout");
  await page.getByLabel("Name").fill("Lorna");
  await page.getByLabel("Mobile number").fill("0917 123 4567");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/orders\/\w+\?t=/);
  const url = new URL(page.url());
  await page.goto(url.pathname + "?t=wrong");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});
