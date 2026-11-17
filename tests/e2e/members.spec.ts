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
    page
      .getByRole("link", { name: "Account", exact: true })
      .filter({ visible: true })
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

test("a Member saves a Favourite and orders a past Order again (ORD-11)", async ({
  page,
}) => {
  await signIn(page, newMember(), "/menu/item/hoshi-latte");
  await page.getByText("Large", { exact: true }).click();
  await page.getByText("Oat milk", { exact: true }).click();
  await page.getByRole("button", { name: "Save as Favourite" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved to your Favourites."
  );

  await page.goto("/account#favourites");
  const favourites = page.getByRole("region", { name: "Your Favourites" });
  await expect(favourites.getByText("Large, Oat milk, 100%")).toBeVisible();
  await expect(favourites.getByText("PHP 250", { exact: true })).toBeVisible();
  await expectNoAxeViolations(page);
  await favourites.getByRole("button", { name: "Add Hoshi Latte" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(
    page.getByRole("main").getByText("Large, Oat milk")
  ).toBeVisible();

  await page.goto("/checkout");
  await page.getByText("Pay at Pickup", { exact: true }).click();
  await page.getByLabel("Name").fill("Migs");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  const code = await page.getByRole("heading", { level: 1 }).innerText();

  await page.goto("/account");
  await page.getByRole("button", { name: `Order again (${code})` }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(
    page.getByRole("main").getByText("Large, Oat milk")
  ).toBeVisible();
});

test("a Guest is asked to sign in to save a Favourite", async ({ page }) => {
  await page.goto("/menu/item/hoshi-latte");
  await page.getByRole("button", { name: "Save as Favourite" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Sign in to save Favourites."
  );
});

test("a Member gets a Birthday Treat in their birthday month (LOY-04)", async ({
  page,
}) => {
  await signIn(page, newMember(), "/account");
  const month = new Date(Date.now() + 8 * 3_600_000).getUTCMonth() + 1;
  await page.getByLabel("Birthday month").selectOption(String(month));
  await page.getByRole("button", { name: "Save my details" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Happy birthday month! We added 9 Stars to your card"
  );
  await expect(page.getByText("A free drink is ready.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Birthday month")).toHaveValue(String(month));
});

// A used or expired link says so and keeps where it was going; a person
// still signed in just gets the page (audit ID1-11).
test("a used sign-in link says so and keeps the page it was for", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "once is enough");
  const { url, target, nonce } = await signIn(page, newMember(), "/account");
  await page.goto(url);
  await expect(page).toHaveURL(new RegExp(`/account\\?t=${nonce}`));
  await expect(
    page.getByText("That link has expired", { exact: false })
  ).toHaveCount(0);
  await page.context().clearCookies();
  await page.goto(url);
  await expect(page).toHaveURL(/\/sign-in\?link=expired&/);
  expect(new URL(page.url()).searchParams.get("next")).toBe(target);
  await expect(
    page.getByText("That link has expired or was already used.", {
      exact: false,
    })
  ).toBeVisible();
  await expectNoAxeViolations(page);
});

// A stranger's requests used to lock a known address out for 15 minutes
// (audit ID2-05), and two connections still did (DC-09): now a stranger
// uses up only their own share. The address-wide 15 is in
// tests/db/limits.test.ts.
test("a stranger's link requests from two connections don't lock someone out", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "once is enough");
  // Clear of the end of a 15-minute window, which would reset the counts;
  // the wait and the eight asks need more than the default 30 s.
  test.setTimeout(120_000);
  const left = 900_000 - (Date.now() % 900_000);
  if (left < 60_000) await page.waitForTimeout(left + 1_000);
  const email = newMember();
  const sent = () =>
    expect(page.getByRole("status").filter({ hasText: email })).toBeVisible();
  const refused = () =>
    expect(
      page.getByText("Too many links asked for. Try again in 15 minutes.")
    ).toBeVisible();
  const ask = async (ip: string) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
    await page.goto("/sign-in");
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("button", { name: "Email me a link" }).click();
  };
  for (let i = 0; i < 3; i++) {
    await ask("198.51.100.31");
    await sent();
  }
  await ask("198.51.100.31");
  await refused();
  for (let i = 0; i < 3; i++) {
    await ask("192.0.2.44");
    await sent();
  }
  // The person, on their own connection.
  await ask("203.0.113.45");
  await sent();
});

// Home showed a Member the example Star Card's sign-in link, and a daily
// drink took five steps (audit UI2-25, FEAT-09).
test("Home gives a Member their own Stars link and their usual, one tap to the Cart", async ({
  page,
}) => {
  await openAllDayToday();
  await signIn(page, newMember(), "/menu/item/hoshi-latte");
  await page.getByText("Oat milk", { exact: true }).click();
  await page.getByRole("button", { name: "Save as Favourite" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved to your Favourites."
  );

  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "See your Stars" })
  ).toHaveAttribute("href", "/account/stars");
  const usual = page.getByRole("region", { name: "Your usual" });
  await expect(usual).toContainText("Hoshi Latte, Regular, Oat milk");
  await expectNoAxeViolations(page);
  await usual.getByRole("button", { name: /^Add for PHP/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("main").getByText("Oat milk")).toBeVisible();
});
