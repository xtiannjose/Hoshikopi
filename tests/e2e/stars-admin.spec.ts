import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { signIn } from "./sign-in";

test("a Manager adjusts a Member's Stars with a reason (LOY-05)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  await signIn(page, "christian@hoshikopi.example", "/manage/stars");
  await expectNoAxeViolations(page);
  await page.getByLabel("Member's email").fill("hoshi@hoshikopi.example");
  await page.getByLabel(/Stars to add/).fill("-5");
  await page.getByLabel("Reason").fill("Test");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("below zero");
  await page.getByLabel(/Stars to add/).fill("2");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved for hoshi@hoshikopi.example."
  );
});
