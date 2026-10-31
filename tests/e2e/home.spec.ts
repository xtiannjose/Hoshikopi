import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home shows the Concept Notice with no axe violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("Hoshikopi is a concept cafe.")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
