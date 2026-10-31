import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, openIn } from "./axe";
import { e2eQuery, openAllDayToday } from "./db";
import { addToCart } from "./order";
import { signIn } from "./sign-in";

test.beforeEach(openAllDayToday);

test("a Member earns Stars, redeems a free drink, cancels and gets them back (Phase 4 exit)", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const email = `stars-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  const member = await (await browser.newContext()).newPage();
  await signIn(member, email, "/account");
  await expect(member.getByText("0 of 9 Stars.")).toBeVisible();

  // Three drinks, through the Bar Screen to Picked Up.
  await addToCart(member, "kopi-hitam", 3);
  await member.goto("/checkout");
  await member.getByText("Pay at Pickup", { exact: true }).click();
  await member.getByLabel("Name").fill("Migs");
  await member.getByRole("button", { name: /Place order/ }).click();
  await expect(member).toHaveURL(/\/orders\//);
  const code = await member.getByRole("heading", { level: 1 }).innerText();

  const bar = await (await browser.newContext()).newPage();
  await signIn(bar, "annika@hoshikopi.example", "/bar");
  const card = bar.getByRole("article", { name: `Order ${code}` });
  for (const step of [
    "Accept",
    "Start making",
    "Ready",
    "Paid and picked up",
  ]) {
    await card.getByRole("button", { name: `${step} ${code}` }).click();
  }
  await expect(card).toHaveCount(0);

  await member.goto("/account");
  await expect(member.getByText("3 of 9 Stars.")).toBeVisible();

  // Six more from the cafe make nine: a free drink.
  const [{ id }] = (
    await e2eQuery("SELECT id FROM users WHERE email = $1", [email])
  ).rows;
  await e2eQuery(
    "INSERT INTO star_entries (id, member_id, kind, stars, reason) VALUES ($1, $2, 'adjust', 6, 'test')",
    [`adj-${Date.now()}`, id]
  );
  await member.goto("/account");
  await expect(member.getByText("A free drink is ready.")).toBeVisible();
  await expectNoAxeViolations(member);

  await addToCart(member, "hoshi-latte");
  await member.goto("/checkout");
  await member.getByText("Use 9 Stars for a free Hoshi Latte").click();
  await expect(
    member.getByRole("button", { name: "Place order, PHP 0" })
  ).toBeVisible();
  await member.getByText("Pay at Pickup", { exact: true }).click();
  await member.getByLabel("Name").fill("Migs");
  await member.getByRole("button", { name: /Place order/ }).click();
  await expect(member).toHaveURL(/\/orders\//);
  await member.goto("/account/stars");
  await expect(member.getByText("0 of 9 Stars.")).toBeVisible();
  await expect(member.getByText("Spent on a free drink")).toBeVisible();

  await member.goBack();
  await member.getByRole("button", { name: "Cancel order" }).click();
  await expect(member.getByRole("status")).toHaveText(
    "This order was cancelled."
  );
  await member.goto("/account/stars");
  await expect(member.getByText("A free drink is ready.")).toBeVisible();
  await expect(member.getByText("Back from a cancelled order")).toBeVisible();
});

for (const palette of ["day", "night"] as const) {
  test(`the Star Card in the ${palette} palette has no axe violations`, async ({
    page,
  }) => {
    await signIn(
      page,
      `card-${Date.now()}-${palette}@example.com`,
      "/account/stars"
    );
    await openIn(page, palette, "/account/stars");
    await expect(page.getByRole("img", { name: /Star Card/ })).toBeVisible();
    await expectNoAxeViolations(page);
  });
}
