import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, openIn } from "./axe";
import { e2eQuery, openAllDayToday } from "./db";
import { addToCart, placeGuestOrder } from "./order";

test.beforeEach(openAllDayToday);

test("the Order page follows the bar live (ORD-08)", async ({ page }) => {
  await addToCart(page, "spanish-latte");
  const id = await placeGuestOrder(page);
  await expect(page.getByRole("status")).toHaveText(
    "Salamat! We got your order. The bar will accept it soon."
  );
  await expect(page.locator('[aria-current="step"]')).toContainText("Placed");

  // Stands in for the Bar Screen (batch 2.7) moving the Order on.
  await e2eQuery(
    "UPDATE orders SET status = 'preparing', accepted_at = now(), updated_at = now() WHERE id = $1",
    [id]
  );
  await expect(page.getByRole("status")).toHaveText(
    "We're making your Spanish Latte.",
    { timeout: 10_000 }
  );
  await expect(page.getByText("can't be cancelled here")).toBeVisible();
});

test("a Customer cancels before the bar accepts (ORD-09)", async ({ page }) => {
  await addToCart(page, "kopi-hitam");
  await placeGuestOrder(page, "Migs");
  await page.getByRole("button", { name: "Cancel order" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "This order was cancelled."
  );
  await expect(page.getByRole("button", { name: "Cancel order" })).toHaveCount(
    0
  );
});

for (const palette of ["day", "night"] as const) {
  test(`the Order page in the ${palette} palette has no axe violations`, async ({
    page,
  }) => {
    await addToCart(page, "matcha-latte");
    const id = await placeGuestOrder(page, "Lorna");
    const url = new URL(page.url());
    await openIn(page, palette, `${url.pathname}${url.search}`);
    expect(id).toBeTruthy();
    await expect(page.getByText("Order Code")).toBeVisible();
    await expectNoAxeViolations(page);
  });
}
