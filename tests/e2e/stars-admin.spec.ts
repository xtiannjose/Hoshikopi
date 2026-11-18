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
  // Their Star Card shows once the email is typed, and follows plus and
  // minus before the save (12.4).
  const line = page.getByText(/Stars? now/);
  await expect(page.getByText("Hoshi", { exact: true })).toBeVisible();
  const now = Number((await line.textContent())?.match(/^(\d+)/)?.[1]);
  expect(now).toBeGreaterThanOrEqual(0);
  await expect(
    page.getByRole("img", { name: /^Star Card: \d of 9 Stars$/ })
  ).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "One Star more" }).click();
  await page.getByRole("button", { name: "One Star more" }).click();
  await page.getByRole("button", { name: "One Star less" }).click();
  await expect(page.getByLabel(/Stars to add/)).toHaveValue("1");
  await expect(line).toContainText(`${now + 1} Star`);

  await page.getByLabel(/Stars to add/).fill(String(-(now + 1)));
  await expect(line).toContainText("below zero after the save");
  await page.getByLabel("Reason").fill("Test");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("below zero");
  await page.getByLabel(/Stars to add/).fill("2");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved for hoshi@hoshikopi.example."
  );
  await expect(line).toHaveText(`${now + 2} Stars now.`);
  await expect(page.getByLabel(/Stars to add/)).toHaveValue("");

  // Stars set for one Member don't carry over to the next email.
  await page.getByRole("button", { name: "One Star more" }).click();
  await expect(page.getByLabel(/Stars to add/)).toHaveValue("1");
  await page.getByLabel("Member's email").fill("annika@hoshikopi.example");
  await expect(page.getByLabel(/Stars to add/)).toHaveValue("");
});
