import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { e2eQuery, endPauseAndBusy, openAllDayToday } from "./db";
import { enterSecondFactor, signIn } from "./sign-in";

test.beforeEach(openAllDayToday);
test.afterEach(async ({}, testInfo) => {
  if (testInfo.tags.includes("@cafe-wide")) await endPauseAndBusy();
});

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

  // A Scheduled Pickup: the second time offered today (tap its label), a
  // window clear of Prep Time even if other specs' Orders raise it before
  // Place order. The full-window test below takes the last, so late at
  // night they differ.
  await guest.goto("/checkout");
  await guest
    .locator('label:has(input[name="pickup"]:not([value="asap"]))')
    .nth(1)
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
  // What to collect, so a Barista needs no Manager screen (audit journeys:7).
  await expect(card).toContainText(/Pay at Pickup: collect PHP \d/);
  await expectNoAxeViolations(bar);

  const steps: [string, string][] = [
    ["Accept", "The bar has your order."],
    // Two drinks: "your order", not the first one's name (audit journeys:13).
    ["Start making", "We're making your order."],
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
  // Collected at the counter, not still "Pay at the counter" (journeys:12).
  await expect(guest.getByText("Paid at the counter.")).toBeVisible();
});

test("a full Pickup Window is never offered (ORD-04)", async ({ page }) => {
  await page.goto("/menu/item/kopi-hitam");
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added");
  await page.goto("/checkout");
  // Chips first, then the Later today list (8.3), in page order.
  const offered = page.locator(
    'input[name="pickup"]:not([value="asap"]):not([value="later"]), select[name="pickupLater"] option'
  );
  // The last window is offered at any hour the test cafe is open.
  const full = await offered.last().getAttribute("value");
  await e2eQuery(
    `INSERT INTO pickup_window_usage (window_start, service_day, drinks, food, updated_at)
     VALUES ($1, ($1::timestamptz AT TIME ZONE 'Asia/Manila')::date, 200, 0, now())
     ON CONFLICT (window_start) DO UPDATE SET drinks = 200`,
    [full]
  );
  await page.reload();
  await expect(page.locator(`[value="${full}"]`)).toHaveCount(0);
});

test("the daily cron needs its secret", async ({ request }) => {
  expect((await request.get("/api/cron/daily")).status()).toBe(401);
  const ok = await request.get("/api/cron/daily", {
    headers: { authorization: "Bearer e2e-cron-secret" },
  });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ expired: expect.any(Number) });
});

test("the Bar Screen says it stopped when its session ends (audit, 7.4)", async ({
  page,
  context,
}) => {
  await signIn(page, "annika@hoshikopi.example", "/bar");
  await expect(page.getByRole("heading", { name: "Bar Screen" })).toBeVisible();
  await context.clearCookies();
  const alert = page.getByRole("alert").filter({ hasText: "signed out" });
  await expect(alert).toBeVisible({ timeout: 10_000 });
  await expect(
    alert.getByRole("link", { name: "Sign in again" })
  ).toHaveAttribute("href", "/sign-in?next=%2Fbar");
});

test("a Manager without the Second Factor gets a link to it, not controls that drop the tap (audit staff:1)", async ({
  page,
}) => {
  const email = "christian@hoshikopi.example";
  await signIn(page, email, "/bar");
  const controls = page.getByRole("button", {
    name: /^(Pause|Resume) ordering/,
  });
  await expect(controls).toHaveCount(0);
  await page
    .getByRole("link", { name: "Enter your code to pause or cancel" })
    .click();
  await enterSecondFactor(page, email);
  await expect(page).toHaveURL(/\/bar$/);
  await expect(controls).toHaveCount(1);
});

test(
  "a Manager turns on Busy Mode from the Bar Screen and checkout says so (8.4)",
  {
    tag: "@cafe-wide",
  },
  async ({ page }) => {
    test.setTimeout(120_000);
    // Busy Mode, like Pause, needs the Manager's Second Factor.
    await signIn(page, "christian@hoshikopi.example", "/manage");
    await page.goto("/bar");
    await page.getByRole("button", { name: "Busy +15 min, 1 hour" }).click();
    const banner = page.getByRole("status").filter({ hasText: "Busy Mode" });
    await expect(banner).toContainText("Busy Mode: Prep Time +15 min until");
    await expectNoAxeViolations(page);

    await page.goto("/menu/item/kopi-hitam");
    await page.getByRole("button", { name: "Add to order" }).click();
    await expect(page.getByRole("status")).toContainText("Added");
    await page.goto("/checkout");
    await expect(
      page.getByText("The bar is extra busy right now")
    ).toBeVisible();

    // End it from the Bar Screen too; afterEach covers a failure.
    await page.goto("/bar");
    await page.getByRole("button", { name: "End Busy Mode" }).click();
    await expect(banner).toHaveCount(0);
  }
);
