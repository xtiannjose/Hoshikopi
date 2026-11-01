import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { e2eQuery, openAllDayToday } from "./db";
import { signIn } from "./sign-in";

test.beforeEach(openAllDayToday);

test("a Guest's Scheduled Order goes through the Bar Screen and the status page follows (Phase 2 exit)", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const guest = await (await browser.newContext()).newPage();
  // Two customized drinks.
  await guest.goto("/menu/item/hoshi-latte");
  await guest.getByText("Oat milk", { exact: true }).click();
  await guest.getByText("Large", { exact: true }).click();
  await guest.getByRole("button", { name: "Add to order" }).click();
  await expect(guest.getByRole("status")).toContainText("Added");
  await guest.goto("/menu/item/ube-latte");
  await guest.getByText("Almond milk", { exact: true }).click();
  await guest
    .getByRole("textbox", { name: /Note for the barista/ })
    .fill("less ice please");
  await guest.getByRole("button", { name: "Add to order" }).click();
  await expect(guest.getByRole("status")).toContainText("Added");

  // A Scheduled Pickup: the first time offered today (tap its label). The
  // full-window test below takes the last, so late at night they differ.
  await guest.goto("/checkout");
  await guest
    .locator('label:has(input[name="pickup"]:not([value="asap"]))')
    .first()
    .click();
  await guest.getByText("Pay at Pickup", { exact: true }).click();
  await guest.getByLabel("Name").fill("Hoshi Santos");
  await guest.getByLabel("Email").fill("hoshi@example.com");
  await guest.getByRole("button", { name: /Place order/ }).click();
  await expect(guest).toHaveURL(/\/orders\/[\w-]+\?t=/);
  const code = await guest.getByRole("heading", { level: 1 }).innerText();

  const bar = await (await browser.newContext()).newPage();
  await signIn(bar, "annika@hoshikopi.example", "/bar");
  const card = bar.getByRole("article", { name: `Order ${code}` });
  // A Scheduled Order may still sit under "Later today".
  if (!(await card.isVisible())) {
    await bar.getByText(/Later today/).click();
  }
  await expect(card).toContainText("Hoshi");
  await expect(card).toContainText("less ice please");
  await expect(card).toContainText("Pay at Pickup");
  await expectNoAxeViolations(bar);

  const steps: [string, string][] = [
    ["Accept", "The bar has your order."],
    ["Start making", "We're making your Hoshi Latte."],
    ["Ready", `Ready at the counter. Show code ${code}.`],
    ["Paid and picked up", "Enjoy! See you again soon."],
  ];
  for (const [button, message] of steps) {
    await card.getByRole("button", { name: `${button} ${code}` }).click();
    // Every 5 seconds until Ready, then every 30 (ADR 0009).
    await expect(guest.getByRole("status")).toHaveText(message, {
      timeout: button === "Paid and picked up" ? 35_000 : 10_000,
    });
  }
  await expect(card).toHaveCount(0);
});

test("a full Pickup Window is never offered (ORD-04)", async ({ page }) => {
  await page.goto("/menu/item/kopi-hitam");
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added");
  await page.goto("/checkout");
  const offered = page.locator('input[name="pickup"]:not([value="asap"])');
  // The last window is offered at any hour the test cafe is open.
  const full = await offered.last().getAttribute("value");
  await e2eQuery(
    `INSERT INTO pickup_window_usage (window_start, service_day, drinks, food, updated_at)
     VALUES ($1, ($1::timestamptz AT TIME ZONE 'Asia/Manila')::date, 200, 0, now())
     ON CONFLICT (window_start) DO UPDATE SET drinks = 200`,
    [full]
  );
  await page.reload();
  await expect(
    page.locator(`input[name="pickup"][value="${full}"]`)
  ).toHaveCount(0);
});

test("the daily cron needs its secret", async ({ request }) => {
  expect((await request.get("/api/cron/daily")).status()).toBe(401);
  const ok = await request.get("/api/cron/daily", {
    headers: { authorization: "Bearer e2e-cron-secret" },
  });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ expired: 0 });
});
