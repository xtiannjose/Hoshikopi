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

test("a Customer asks to be told, and Ready chimes in and notifies", async ({
  page,
}) => {
  // Stands in for the browser's notifications, to record what is shown.
  await page.addInitScript(() => {
    const shown: string[] = [];
    (window as unknown as { shown: string[] }).shown = shown;
    const registration = {
      showNotification: async (title: string, options?: { body?: string }) => {
        shown.push(`${title}: ${options?.body}`);
      },
    };
    const permission = { value: "default" };
    Object.assign(window, {
      Notification: {
        get permission() {
          return permission.value;
        },
        requestPermission: async () => (permission.value = "granted"),
      },
    });
    Object.defineProperty(Navigator.prototype, "serviceWorker", {
      get: () => ({
        register: async () => registration,
        ready: Promise.resolve(registration),
      }),
      configurable: true,
    });
  });
  await addToCart(page, "spanish-latte");
  const id = await placeGuestOrder(page);
  const code = (
    await page.getByRole("heading", { level: 1 }).innerText()
  ).trim();

  await page.getByRole("button", { name: "Notify me when it's ready" }).click();
  await expect(
    page.getByText("We'll let you know here when it's ready.")
  ).toBeVisible();

  await e2eQuery(
    "UPDATE orders SET status = 'ready', accepted_at = now(), ready_at = now(), updated_at = now() WHERE id = $1",
    [id]
  );
  await expect(page.getByRole("status")).toHaveText(
    `Ready at the counter. Show code ${code}.`,
    { timeout: 10_000 }
  );
  await expect(page).toHaveTitle(`Ready! ${code} · Hoshikopi`);
  expect(
    await page.evaluate(() => (window as unknown as { shown: string[] }).shown)
  ).toEqual([
    `Your order is ready: Salamat! Show code ${code} at the counter.`,
  ]);
});
