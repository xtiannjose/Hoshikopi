import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { openAllDayToday } from "./db";
import { addToCart } from "./order";

test.beforeEach(openAllDayToday);

async function checkoutOnline(page: import("@playwright/test").Page) {
  await page.goto("/checkout");
  await page.getByText("GCash", { exact: true }).click();
  await page.getByLabel("Name").fill("Hoshi");
  await page.getByLabel("Email").fill("hoshi@example.com");
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

// The checkout stays open after a failed try, so the Order page offers it
// again; said once, and no "place it again" for a Cart already emptied
// (audit journeys:6).
test("a failed Test Mode payment can be paid again from the Order page", async ({
  page,
}) => {
  await addToCart(page, "kopi-hitam");
  await checkoutOnline(page);
  await page.getByRole("button", { name: "Make the payment fail" }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  await expect(page.getByRole("status")).toHaveText(
    "We got your order, but the payment didn't go through."
  );
  await expect(page.getByText(/didn't go through/)).toHaveCount(1);
  await expect(page.getByText(/place it again/)).toHaveCount(0);
  await expect(
    page.getByText(
      "We hold an unpaid order for 15 minutes after you place it. Not ordering after all? Cancel it below."
    )
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel order" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Try paying again" }).click();
  await expect(page).toHaveURL(/\/dev\/pay\/fake_cs_/);
  await page.getByRole("button", { name: /^Pay PHP/ }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  await expect(page.getByRole("status")).toHaveText(
    "Payment received. The bar starts on it soon.",
    { timeout: 10_000 }
  );
});

// Like PayMongo's cancel_url: back to the Order page, nothing cancelled
// (audit journeys:21).
test("going back from the Test Mode checkout leaves the Order to pay or cancel", async ({
  page,
}) => {
  await addToCart(page, "kopi-hitam");
  await checkoutOnline(page);
  await page.getByRole("link", { name: "Go back without paying" }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  await expect(page.getByRole("status")).toHaveText(
    "Salamat! We got your order. Finish paying to send it to the bar."
  );
  await expect(page.getByRole("link", { name: "Finish paying" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel order" })
  ).toBeVisible();
});

test("the webhook route refuses an unsigned event", async ({ request }) => {
  const response = await request.post("/api/webhooks/fake", {
    data: { id: "evt_x", type: "paid", checkoutId: "cs", paymentId: "p" },
  });
  expect(response.status()).toBe(401);
});
