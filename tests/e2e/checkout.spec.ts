import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { openAllDayToday } from "./db";
import { addToCart } from "./order";

test.beforeEach(openAllDayToday);

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

  await page.getByText("Pay at Pickup", { exact: true }).click();
  await page.getByLabel("Name").fill("Bea");
  await page.getByLabel("Email").fill("bea@example.com");
  await page.getByRole("button", { name: /Place order, PHP 260/ }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  await expect(page.getByRole("status")).toHaveText(
    "Salamat! We got your order. The bar will accept it soon."
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^K-\d{3}$/);
  // The "Order placed" email went out with the same Order Code (ORD-10).
  const code = await page.getByRole("heading", { level: 1 }).innerText();
  await expect
    .poll(async () => {
      const dir = path.join(process.cwd(), "data", "mail");
      const files = await readdir(dir).catch(() => []);
      const texts = await Promise.all(
        files.map((f) => readFile(path.join(dir, f), "utf8"))
      );
      return texts.some((t) => t.includes(`Order ${code} at Hoshikopi`));
    })
    .toBe(true);
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
  // What was typed stays after the refusal.
  await expect(page.getByLabel("Name")).toHaveValue("Migs");
});

test("a Guest can't pay at pickup for more than 4 drinks (PAY-02)", async ({
  page,
}) => {
  await addToCart(page, "kopi-hitam", 5);
  await page.goto("/checkout");
  await expect(
    page.getByText(
      "Guests can pay at pickup for up to 4 drinks; pay online for more."
    )
  ).toBeVisible();
  await expect(page.getByText("Pay at Pickup", { exact: true })).toHaveCount(0);
});

test("an Order page needs its link token", async ({ page }) => {
  await addToCart(page, "kopi-hitam");
  await page.goto("/checkout");
  await page.getByText("Pay at Pickup", { exact: true }).click();
  await page.getByLabel("Name").fill("Lorna");
  await page.getByLabel("Mobile number").fill("0917 123 4567");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  const url = new URL(page.url());
  await page.goto(url.pathname + "?t=wrong");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});
