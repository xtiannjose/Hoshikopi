import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { e2eQuery, endPauseAndBusy, openAllDayToday } from "./db";
import { addToCart, placeGuestOrder } from "./order";
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
  // Expiry, and the Pay at Pickup Orders nobody took (audit ORD-13).
  expect(await ok.json()).toMatchObject({
    expired: expect.any(Number),
    cancelled: expect.any(Number),
  });
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

    // Manage shows it too, and ends it (audit staff:4); afterEach covers a
    // failure.
    await page.goto("/manage");
    await expect(page.getByRole("link", { name: /Ordering/ })).toContainText(
      "Busy Mode +15 min until"
    );
    await page.goto("/manage/hours");
    const busy = page.getByRole("status").filter({ hasText: "Busy Mode" });
    await expect(busy).toContainText("Busy Mode: Prep Time +15 min until");
    await expect(page.getByText("with Busy Mode's +15")).toBeVisible();
    await page.getByRole("button", { name: "End Busy Mode" }).click();
    await expect(busy).toHaveCount(0);
    await page.goto("/bar");
    await expect(banner).toHaveCount(0);
  }
);

// Better Auth trusted its 5-minute cookie cache, so a session ended from
// Sign out everywhere kept the board going (audit staff:17).
test("the Bar Screen stops at once when its session is ended elsewhere", async ({
  page,
  context,
}) => {
  await signIn(page, "annika@hoshikopi.example", "/bar");
  await expect(page.getByRole("heading", { name: "Bar Screen" })).toBeVisible();
  const cookie = (await context.cookies()).find((c) =>
    c.name.endsWith("session_token")
  )!;
  // Only this page's session, so other specs signed in as Annika keep theirs.
  await e2eQuery("DELETE FROM sessions WHERE token = $1", [
    decodeURIComponent(cookie.value).split(".")[0],
  ]);
  await expect(
    page.getByRole("alert").filter({ hasText: "signed out" })
  ).toBeVisible({ timeout: 10_000 });
});

// Sold Out was only on /manage/menu, behind the Second Factor, so a Barista
// who never set up an authenticator could not mark it (STAFF-03, audit
// staff:8).
test("a Barista with no authenticator marks Sold Out and back on the Bar Screen @cafe-wide", async ({
  page,
}) => {
  const id = `e2e-${Date.now()}`;
  const email = `${id}@hoshikopi.example`;
  await e2eQuery(
    `INSERT INTO users (id, name, email, email_verified, role, updated_at)
     VALUES ($1, 'Lia', $2, true, 'barista', now())`,
    [id, email]
  );
  try {
    await signIn(page, email, "/bar");
    await expect(page.getByRole("link", { name: "Sold out?" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Manage" })).toHaveCount(0);
    await page.locator("summary", { hasText: "Sold out today" }).click();
    await page
      .getByRole("button", { name: "Sold out for Butter Croissant" })
      .click();
    await expect(
      page.getByRole("button", { name: "Back on for Butter Croissant" })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/bar/);
    await expectNoAxeViolations(page);
    await page
      .getByRole("button", { name: "Back on for Butter Croissant" })
      .click();
    await expect(
      page.getByRole("button", { name: "Sold out for Butter Croissant" })
    ).toBeVisible();
    const { rows } = await e2eQuery(
      "SELECT 1 FROM two_factors WHERE user_id = $1",
      [id]
    );
    expect(rows).toHaveLength(0);
  } finally {
    await e2eQuery(
      "UPDATE menu_items SET sold_out_on = NULL WHERE slug = 'butter-croissant'"
    );
  }
});

// The tablet slept and stopped polling (FEAT-11); a reload chimed silently
// with nothing on screen (staff:22); ASAP cards hid the promised time and
// nothing marked a late one (staff:14); an accepted card glowed again in
// Making (motion:5).
test("the Bar Screen stays awake, asks for a tap for sound, and shows when an Order is due", async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  test.setTimeout(120_000);
  const bar = await (await browser.newContext()).newPage();
  await bar.addInitScript(() => {
    const calls: string[] = [];
    Object.assign(window, { wakeCalls: calls });
    Object.defineProperty(navigator, "wakeLock", {
      value: {
        request: async (type: string) => {
          calls.push(type);
          return { release: async () => {} };
        },
      },
    });
  });
  await signIn(bar, "annika@hoshikopi.example", "/bar");
  await expect
    .poll(() =>
      bar.evaluate(
        () => (window as unknown as { wakeCalls: string[] }).wakeCalls
      )
    )
    .toContain("screen");
  const tap = bar.getByRole("button", { name: "Tap to turn on sound" });
  await tap.click();
  await expect(tap).toHaveCount(0);

  const guest = await (await browser.newContext()).newPage();
  await addToCart(guest, "kopi-hitam");
  await placeGuestOrder(guest, "Lia");
  const code = await guest.getByRole("heading", { level: 1 }).innerText();
  const card = bar.getByRole("article", { name: `Order ${code}` });
  await expect(card).toHaveClass(/animate-arrive/);
  await expect(card).toContainText(/ASAP, due \d{1,2}:\d{2} [AP]M/);
  await card.getByRole("button", { name: `Accept ${code}` }).click();
  await expect(
    bar.getByRole("region", { name: /Making/ }).getByRole("article", {
      name: `Order ${code}`,
    })
  ).not.toHaveClass(/animate-arrive/);

  // Past its promised time: Late. A reload asks for the tap again.
  await e2eQuery(
    "UPDATE orders SET window_start = now() - interval '5 minutes' WHERE code = $1",
    [code]
  );
  await bar.reload();
  await expect(card).toContainText("Late");
  await expect(tap).toBeVisible();
  await expectNoAxeViolations(bar);
});
