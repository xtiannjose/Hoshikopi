import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { openAllDayToday } from "./db";
import { addToCart } from "./order";
import { signIn } from "./sign-in";

test.beforeEach(openAllDayToday);

const newMember = () =>
  `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;

test("a first sign-in makes a Member who keeps the Guest Cart and sees past Orders (ACC-01, ACC-02)", async ({
  page,
}) => {
  const email = newMember();
  // A Guest Cart first, then sign in: it joins the Member's Cart.
  await addToCart(page, "tablea-tsokolate");
  await signIn(page, email, "/account");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi!");
  await expect(page.getByText(`Signed in as ${email}.`)).toBeVisible();
  const menu = page.getByRole("button", { name: "Open the menu" });
  if (await menu.isVisible()) await menu.click();
  await expect(
    page.getByRole("link", { name: "Account" }).filter({ visible: true })
  ).toBeVisible();
  await expectNoAxeViolations(page);

  await page.goto("/checkout");
  await expect(page.getByLabel("Email")).toHaveValue(email);
  await expect(page.getByText("1 x Tablea Tsokolate")).toBeVisible();
  await page.getByText("Pay at Pickup", { exact: true }).click();
  await page.getByLabel("Name").fill("Migs");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  // Members are not asked to sign up.
  await expect(page.getByText("Collect Stars next time")).toHaveCount(0);
  const code = await page.getByRole("heading", { level: 1 }).innerText();

  await page.goto("/account");
  await expect(page.getByRole("link", { name: code })).toBeVisible();
  await expect(page.getByText("1 x Tablea Tsokolate")).toBeVisible();
});

test("a Member may Pay at Pickup for more than 4 drinks", async ({ page }) => {
  await signIn(page, newMember(), "/");
  await addToCart(page, "kopi-hitam", 6);
  await page.goto("/checkout");
  await expect(page.getByText("Pay at Pickup", { exact: true })).toBeVisible();
});

test("a Guest is offered an account after ordering (ORD-05)", async ({
  page,
}) => {
  await addToCart(page, "kopi-hitam");
  await page.goto("/checkout");
  await page.getByText("Pay at Pickup", { exact: true }).click();
  await page.getByLabel("Name").fill("Lorna");
  await page.getByLabel("Email").fill("lorna@example.com");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page.getByText("Collect Stars next time")).toBeVisible();
});
