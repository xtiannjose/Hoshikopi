import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, openIn } from "./axe";
import { signIn } from "./sign-in";

for (const palette of ["day", "night"] as const) {
  test(`the privacy notice in the ${palette} palette has no axe violations`, async ({
    page,
  }) => {
    await openIn(page, palette, "/privacy");
    await expect(
      page.getByRole("heading", { name: "Your rights" })
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

test("a Member saves details, downloads their data and deletes the account (ACC-03)", async ({
  page,
}) => {
  const email = `privacy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
  await signIn(page, email, "/account");
  await page.getByLabel("Name for your orders").fill("Tita Lorna");
  await page.getByText("Email me about new drinks and Events").click();
  await page.getByRole("button", { name: "Save my details" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Hi, Tita Lorna!"
  );
  await expectNoAxeViolations(page);

  const download = await page.request.get("/api/account/export");
  expect(download.headers()["content-disposition"]).toContain(
    "hoshikopi-my-data.json"
  );
  expect(await download.json()).toMatchObject({
    profile: { name: "Tita Lorna", email, marketingOptIn: true },
    orders: [],
  });

  await page.getByText("Delete my account", { exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete my account" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/sign-in/);
});
