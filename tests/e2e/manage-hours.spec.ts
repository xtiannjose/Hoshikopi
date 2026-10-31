import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { signIn } from "./sign-in";

// Shared cafe settings: one project, one at a time.
test.describe.configure({ mode: "serial" });
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
});

test("a Manager pauses ordering and resumes it", async ({ page }) => {
  await signIn(page, "hoshi@hoshikopi.example", "/manage/hours");
  await expectNoAxeViolations(page);
  await page.getByLabel("Message for Customers").fill("Back in 15, salamat!");
  await page.getByRole("button", { name: "Pause ordering" }).click();
  await expect(page.getByText("New Orders are paused until")).toBeVisible();
  await page.getByRole("button", { name: "Resume ordering" }).click();
  await expect(
    page.getByRole("button", { name: "Pause ordering" })
  ).toBeVisible();
});

test("Special Hours show on the visit page", async ({ page }) => {
  await signIn(page, "hoshi@hoshikopi.example", "/manage/hours");
  const day = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Date").fill(day);
  await page.getByLabel("Why (shown to Customers)").fill("Coffee festival");
  await page.getByRole("button", { name: "Add Special Hours" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await expect(async () => {
    await page.goto("/cafe");
    await expect(page.getByText(/Coffee festival/)).toBeVisible({
      timeout: 1_000,
    });
  }).toPass({ timeout: 75_000 });
});

test("Opening Hours refuse Last Order after closing", async ({ page }) => {
  await signIn(page, "hoshi@hoshikopi.example", "/manage/hours");
  await page.getByLabel("Monday last order").fill("21:30");
  await page.getByRole("button", { name: "Save Opening Hours" }).click();
  await expect(
    page.getByText("Last order must be after opening and by closing.")
  ).toBeVisible();
});
