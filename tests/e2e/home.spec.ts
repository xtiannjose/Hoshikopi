import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, NIGHT_TIME, openIn } from "./axe";
import { openAllDayToday } from "./db";

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
  // People tap the sun; the radio inside its label is visually hidden.
  await page.getByTitle("Day").filter({ visible: true }).click();
  await expect(
    page.getByRole("radio", { name: "Day" }).filter({ visible: true })
  ).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await page.clock.setFixedTime(NIGHT_TIME);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
});

// The Star Card sits far below the fold on Home, so its Stars light as it
// scrolls into view, not on load (audit motion:4).
test("on Home the Star Card lights as it scrolls into view", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "once is enough");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const card = page.getByRole("img", { name: /Star Card/ });
  const star = card.locator("path").last();
  await expect(star).toHaveCSS("animation-timeline", "--star-card");
  await expect(star).toHaveCSS("opacity", "0");
  await card.scrollIntoViewIfNeeded();
  await expect(star).toHaveCSS("opacity", "1");
});

test("the share image is a PNG", async ({ request }) => {
  const response = await request.get("/opengraph-image");
  expect(response.headers()["content-type"]).toBe("image/png");
});

// A made-up slug got a 200 card, rendered on every request (SEC1-12).
test("a page has its share card, and a made-up slug has none", async ({
  page,
  request,
}) => {
  for (const [path, slug] of [
    ["/menu/item/hoshi-latte", "hoshi-latte"],
    ["/events/latte-art-night", "latte-art-night"],
    ["/news/our-beans-from-benguet", "our-beans-from-benguet"],
  ]) {
    await page.goto(path);
    const image = await page
      .locator('meta[property="og:image"]')
      .first()
      .getAttribute("content");
    const card = new URL(image!).pathname;
    const found = await request.get(card);
    expect(found.status()).toBe(200);
    expect(found.headers()["content-type"]).toBe("image/png");
    const madeUp = card.replace(`/${slug}/`, "/no-such-slug/");
    expect((await request.get(madeUp)).status()).toBe(404);
  }
});

// The hero card had no Pickup Time (UI2-05), and Home never pointed to the
// two-minute demo (journeys:20). A Guest gets the sign-in link (UI2-25).
test("the hero shows the next Pickup Times and the demo guide", async ({
  page,
}) => {
  await openAllDayToday();
  await page.goto("/");
  const times = page.getByRole("list", { name: "Next Pickup Times" });
  await expect(times.getByRole("listitem")).toHaveCount(5);
  await expect(page.getByText("Order now, pick up at")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "See how in two minutes" })
  ).toHaveAttribute("href", "/concept#try");
  await expect(
    page.getByRole("link", { name: "Get your Star Card" })
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Your usual" })).toHaveCount(0);
});
