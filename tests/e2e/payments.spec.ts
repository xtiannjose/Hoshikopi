import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { openAllDayToday } from "./db";
import { addToCart } from "./order";

test.beforeEach(openAllDayToday);

async function checkoutOnline(page: import("@playwright/test").Page) {
  await page.goto("/checkout");
  await page.getByText("GCash", { exact: true }).click();
  await page.getByLabel("Name").fill("Bea");
  await page.getByLabel("Email").fill("bea@example.com");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/dev\/pay\/fake_cs_/);
}

test("a Guest pays with GCash in Test Mode and the Order turns Paid (PAY-01, PAY-03)", async ({
  page,
}) => {
  // Five drinks: more than a Guest may Pay at Pickup, fine online.
  await addToCart(page, "kopi-hitam", 5);
  await checkoutOnline(page);
  await expect(page.getByText("Test Mode: no real money moves")).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: /^Pay PHP/ }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  await expect(page.getByRole("status")).toHaveText(
    "Payment received. The bar starts on it soon.",
    { timeout: 10_000 }
  );
  await expect(page.getByText("Paid online (Test Mode).")).toBeVisible();
});

test("a failed Test Mode payment leaves the Order waiting", async ({
  page,
}) => {
  await addToCart(page, "kopi-hitam");
  await checkoutOnline(page);
  await page.getByRole("button", { name: "Make the payment fail" }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  await expect(page.getByText("Your payment didn't go through.")).toBeVisible();
});

test("the webhook route refuses an unsigned event", async ({ request }) => {
  const response = await request.post("/api/webhooks/fake", {
    data: { id: "evt_x", type: "paid", checkoutId: "cs", paymentId: "p" },
  });
  expect(response.status()).toBe(401);
});
