import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { e2eQuery } from "./db";
import { signIn } from "./sign-in";

test("a seeded Manager signs in to /manage", async ({ page }) => {
  await signIn(page, "hoshi@hoshikopi.example", "/manage");
  await expect(page.getByText("Signed in as Hoshi (Manager).")).toBeVisible();
  await expectNoAxeViolations(page);
});

test("a seeded Barista signs in to /manage", async ({ page }) => {
  await signIn(page, "annika@hoshikopi.example", "/manage");
  await expect(page.getByText("Signed in as Annika (Barista).")).toBeVisible();
});

// The check runs inside a streamed Suspense boundary, so the status is
// already 200; the page shows not-found and is marked noindex.
test("a Member gets not-found from /manage", async ({ page }) => {
  await signIn(page, "christian@hoshikopi.example", "/");
  await page.goto("/manage");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
  await expect(page.getByText(/Signed in as/)).toHaveCount(0);
});

test("signed out, /manage asks to sign in", async ({ page }) => {
  await page.goto("/manage");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmanage/);
});

test("Staff set up a Second Factor before /manage; the Bar Screen skips it (ADR 0014)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  // A new Barista, so no other test has enrolled them yet.
  const id = `e2e-${Date.now()}`;
  const email = `${id}@hoshikopi.example`;
  await e2eQuery(
    `INSERT INTO users (id, name, email, email_verified, role, updated_at)
     VALUES ($1, 'Lia', $2, true, 'barista', now())`,
    [id, email]
  );
  await signIn(page, email, "/bar");
  await expect(page).toHaveURL(/\/bar/);

  await page.goto("/manage");
  await expect(page).toHaveURL(/\/manage\/two-factor/);
  await expect(
    page.getByRole("heading", { name: "Set up your authenticator" })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR code for your authenticator app" })
  ).toBeVisible();
  await expectNoAxeViolations(page);

  const code = page.getByLabel("6-digit code");
  await code.fill("000000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("That code didn't match.")).toBeVisible();

  // What an authenticator app makes of the setup key.
  const key = (await page.locator("code").textContent())!.replace(/\s/g, "");
  const secret = new TextDecoder().decode(base32.decode(key));
  await code.fill(await createOTP(secret).totp());
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Signed in as Lia (Barista).")).toBeVisible();
});
