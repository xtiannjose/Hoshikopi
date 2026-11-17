import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, openIn } from "./axe";
import { signIn } from "./sign-in";

for (const palette of ["day", "night"] as const) {
  test(`/cafe in the ${palette} palette answers where, when and what`, async ({
    page,
  }) => {
    await openIn(page, palette, "/cafe");
    await expect(page.getByText("Every day, 7:00 AM to 9:00 PM")).toBeVisible();
    await expect(page.getByText("Last order 8:30 PM")).toBeVisible();
    await expect(page.getByText("Dogs welcome")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open in Maps" })
    ).toBeVisible();
    // 10 AM and 8 PM are both within 7 AM to 9 PM.
    await expect(page.getByText("Open now")).toBeVisible();
    await page.getByText("Can I pay at the counter?").click();
    await expect(page.getByText("for up to 4 drinks")).toBeVisible();
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(JSON.parse(jsonLd ?? "{}")).toMatchObject({
      "@type": "CafeOrCoffeeShop",
      acceptsReservations: false,
    });
    await expectNoAxeViolations(page);
  });

  test(`home in the ${palette} palette has its own hero line`, async ({
    page,
  }) => {
    await openIn(page, palette, "/");
    const title =
      palette === "day"
        ? "Your kopi, ready before you get here."
        : "Your kopi, ready when you are.";
    // Both lines are in the page; only the palette's one is visible.
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title, {
      useInnerText: true,
    });
    // Each palette shows its own three Barista Picks (INFO-13).
    const picks = page.getByRole("region", {
      name:
        palette === "day"
          ? "Barista picks this week"
          : "Barista picks to take it slow",
    });
    await expect(picks).toBeVisible();
    await expect(picks.getByRole("heading", { level: 3 })).toHaveText(
      palette === "day"
        ? ["Hoshi Latte", "Tablea Tsokolate", "Ube Pandesal"]
        : ["Cafe Mocha", "Tanglad Ginger Tea", "Banana Bread slice"]
    );
    await expect(page.locator("#visit")).toContainText("Kapitolyo, Pasig");
    await expectNoAxeViolations(page);
  });
}

test("the Home menu switches from the list to photos", async ({ page }) => {
  await page.goto("/");
  const menu = page.locator("#menu");
  await expect(
    menu.getByRole("heading", { name: "Make it yours" })
  ).toBeVisible();
  await menu.getByText("Photos", { exact: true }).click();
  await expect(
    menu.getByRole("heading", { name: "Make it yours" })
  ).toBeHidden();
  await expect(
    menu.getByRole("article").filter({ hasText: "Hoshi Latte" })
  ).toBeVisible();
});

// At xl a grid left Make it yours alone in a last row (audit UI2-21).
test("the printed menu packs its blocks in columns, with no lone last row (audit UI2-21)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the columns start at xl");
  await page.goto("/");
  const menu = page.locator("#menu");
  const coffee = await menu
    .getByRole("heading", { name: "Coffee", exact: true, level: 3 })
    .boundingBox();
  const yours = await menu
    .getByRole("heading", { name: "Make it yours" })
    .boundingBox();
  expect(yours!.x).toBeGreaterThan(coffee!.x);
});

// A caption under a plain stand-in labelled a picture nobody sees
// (ADR 0012, audit UI2-02).
test("a stand-in photo has no caption (ADR 0012, audit UI2-02)", async ({
  page,
}) => {
  for (const path of ["/", "/cafe"]) {
    await page.goto(path);
    await expect(
      page.locator("figure:not(:has(img)) figcaption"),
      path
    ).toHaveCount(0);
  }
  await page.goto("/concept");
  await expect(page.getByText("marked as such")).toHaveCount(0);
});

test("it says closed after closing time", async ({ page }) => {
  // 10 PM in Manila.
  await page.clock.setFixedTime(new Date("2026-11-02T14:00:00Z"));
  await page.goto("/cafe");
  await expect(page.getByText("Closed now")).toBeVisible();
  await expect(page.getByText("opens 7:00 AM tomorrow")).toBeVisible();
});

test("a Manager edits the parking note and /cafe shows it", async ({
  page,
}, testInfo) => {
  // One project only: both would edit the same row at once.
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  await signIn(page, "christian@hoshikopi.example", "/manage/cafe");
  const note = `Park at the church lot ${Date.now()}.`;
  await page.getByLabel("Parking and the nearest car park").fill(note);
  await page.getByRole("button", { name: "Save cafe details" }).click();
  await expect(page.getByRole("status")).toContainText("Saved.");
  // In the Amenities and in the parking question; the first visit after a
  // change may get the old page while Next renders the new one.
  await expect(async () => {
    await page.goto("/cafe");
    await expect(page.getByText(note).first()).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
});

test("a Barista cannot open the cafe details", async ({ page }) => {
  await signIn(page, "annika@hoshikopi.example", "/manage/cafe");
  await expect(
    page.getByRole("heading", { name: /could not be found/i })
  ).toBeVisible();
});
