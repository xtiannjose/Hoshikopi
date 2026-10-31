import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { signIn } from "./sign-in";

test("a seeded Manager signs in to /manage", async ({ page }) => {
  await signIn(page, "kai@hoshikopi.example", "/manage");
  await expect(page.getByText("Signed in as Kai (Manager).")).toBeVisible();
  await expectNoAxeViolations(page);
});

test("a seeded Barista signs in to /manage", async ({ page }) => {
  await signIn(page, "jomar@hoshikopi.example", "/manage");
  await expect(page.getByText("Signed in as Jomar (Barista).")).toBeVisible();
});

// The check runs inside a streamed Suspense boundary, so the status is
// already 200; the page shows not-found and is marked noindex.
test("a Member gets not-found from /manage", async ({ page }) => {
  await signIn(page, "bea@hoshikopi.example", "/");
  await page.goto("/manage");
  await expect(page.getByText(/could not be found/i)).toBeVisible();
  await expect(page.getByText(/Signed in as/)).toHaveCount(0);
});

test("signed out, /manage asks to sign in", async ({ page }) => {
  await page.goto("/manage");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmanage/);
});
