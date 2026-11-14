import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { openAllDayToday } from "./db";
import { mailTo } from "./mail";
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
  await page.getByLabel("Name").fill("Hoshi");
  // An address of its own, so only this Order's email can match.
  const address = `hoshi-${Date.now()}@example.com`;
  await page.getByLabel("Email").fill(address);
  await page.getByRole("button", { name: /Place order, PHP 260/ }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  await expect(page.getByRole("status")).toHaveText(
    "Salamat! We got your order. The bar will accept it soon."
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^K-\d{3}$/);
  // The "Order placed" email went out with the same Order Code (ORD-10).
  const code = await page.getByRole("heading", { level: 1 }).innerText();
  await expect
    .poll(async () =>
      (await mailTo(address)).some((t) =>
        t.includes(`Order ${code} at Hoshikopi`)
      )
    )
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

test("a refused checkout keeps the chosen Pickup Time and Payment Method (audit, 7.1)", async ({
  page,
}) => {
  await addToCart(page, "kopi-hitam");
  await page.goto("/checkout");
  const later = page.locator('input[name="pickup"]:not([value="asap"])').last();
  const time = await later.getAttribute("value");
  await later.locator("xpath=..").click();
  await page.getByText("Pay at Pickup", { exact: true }).click();
  await page.getByLabel("Email").fill("migs@example.com");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page.getByText("Check the details above.")).toBeVisible();
  await expect(
    page.locator(`input[name="pickup"][value="${time}"]`)
  ).toBeChecked();
  await expect(
    page.getByRole("radio", { name: /Pay at Pickup/ })
  ).toBeChecked();
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
  await expect(
    page.getByRole("heading", { name: /could not be found/i })
  ).toBeVisible();
});

test("checkout refuses an 11th try from one Cart in 15 minutes", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "once is enough");
  // Its own IP, so other tests' Orders don't share this bucket.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "203.0.113.11" });
  await addToCart(page, "hoshi-latte");
  await page.goto("/checkout");
  const place = page.getByRole("button", { name: /Place order/ });
  // Tries without contact details are refused fast but still count.
  await place.evaluate((button) => {
    (button as HTMLButtonElement).form!.noValidate = true;
  });
  for (let i = 0; i < 10; i++) {
    // This try's own answer: the checkout Server Action, not any POST, or
    // the next click can land while this one is still pending and not count.
    const answered = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        new URL(r.url()).pathname === "/checkout" &&
        r.request().headers()["next-action"] !== undefined
    );
    await place.click();
    await answered;
    await expect(place).toBeEnabled();
  }
  await place.click();
  await expect(page.getByText("Too many tries.")).toBeVisible();
});

test("Pickup Time offers the next few times as chips and the rest in a list (8.3)", async ({
  page,
}) => {
  await addToCart(page, "kopi-hitam");
  await page.goto("/checkout");
  const chips = page.locator(
    'input[name="pickup"]:not([value="asap"]):not([value="later"])'
  );
  expect(await chips.count()).toBeLessThanOrEqual(6);
  const list = page.getByLabel("Time later today");
  // The list holds the windows after the first 6. Late in the evening
  // (Manila) none may be left today, and the server reads the real clock.
  const later = await list.locator("option").count();
  test.skip(later === 0, "no Pickup Window left after the first 6 today");
  const time = (await list.locator("option").last().textContent())!;
  await list.selectOption({ index: later - 1 });
  await expect(
    page.locator('input[name="pickup"][value="later"]')
  ).toBeChecked();
  await expectNoAxeViolations(page);
  await page.getByText("Pay at Pickup", { exact: true }).click();
  await page.getByLabel("Name").fill("Lorna");
  await page.getByLabel("Email").fill("lorna@example.com");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  await expect(page.getByText(`Pickup at ${time}.`)).toBeVisible();
});
