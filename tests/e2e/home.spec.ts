import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, NIGHT_TIME, openIn } from "./axe";

for (const palette of ["day", "night"] as const) {
  test(`home in the ${palette} palette has the shell and no axe violations`, async ({
    page,
  }) => {
    await openIn(page, palette, "/");
    await expect(page.getByRole("link", { name: /Cart/ })).toBeVisible();
    const footer = page.getByRole("contentinfo");
    await expect(footer).toContainText("Kapitolyo, Pasig");
    await expect(footer).toContainText("Hoshikopi is a concept cafe.");
    await expect(
      footer.getByRole("link", { name: "About this concept" }).first()
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test(`/concept in the ${palette} palette has no axe violations`, async ({
    page,
  }) => {
    await openIn(page, palette, "/concept");
    await expect(
      page.getByRole("heading", { name: "What's made up" })
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

test("the switch pins Day at night, and it lasts a reload", async ({
  page,
}) => {
  await openIn(page, "night", "/");
  const menu = page.getByRole("button", { name: "Open the menu" });
  if (await menu.isVisible()) await menu.click();
  // People tap the label; the radio inside it is visually hidden.
  await page
    .getByText("Day", { exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page.getByRole("radio", { name: "Day" }).filter({ visible: true })
  ).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await page.clock.setFixedTime(NIGHT_TIME);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
});

test("the share image is a PNG", async ({ request }) => {
  const response = await request.get("/opengraph-image");
  expect(response.headers()["content-type"]).toBe("image/png");
});
