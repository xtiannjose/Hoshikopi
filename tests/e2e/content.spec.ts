import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, openIn } from "./axe";
import { signIn } from "./sign-in";

for (const palette of ["day", "night"] as const) {
  test(`Events and news in the ${palette} palette (EVT-01, NEWS-01)`, async ({
    page,
  }) => {
    await openIn(page, palette, "/events");
    await expect(
      page.getByRole("heading", { name: "Latte art night" })
    ).toBeVisible();
    await expect(page.getByText("PHP 350")).toBeVisible();
    await expectNoAxeViolations(page);

    await page.getByRole("link", { name: "Latte art night" }).click();
    await expect(page).toHaveURL(/\/events\/latte-art-night$/);
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(JSON.parse(jsonLd ?? "{}")).toMatchObject({
      "@type": "Event",
      name: "Latte art night",
      offers: { price: "350.00", priceCurrency: "PHP" },
    });
    await expectNoAxeViolations(page);

    await openIn(page, palette, "/news/how-we-make-the-hoshi-latte");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "How we make the Hoshi Latte",
      })
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

test("Home shows the next Event, the latest Post and the Star Card (NEWS-02)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Upcoming event" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Latest post" })
  ).toBeVisible();
  await expect(page.getByText("Example card: 5 of 9")).toBeVisible();
});

test("a Manager publishes an Event and it shows (STAFF-06)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  test.setTimeout(240_000);
  await signIn(page, "hoshi@hoshikopi.example", "/manage/events/new");
  await page.getByLabel("Title").fill("Cupping with Annika");
  await page.getByLabel("Web address").fill("cupping-with-annika");
  await page
    .getByLabel("One line about it")
    .fill("Taste three Benguet coffees side by side.");
  await page.getByLabel("About the Event").fill("**Free**, eight seats.");
  await expect(
    page.getByRole("region", { name: "Preview" }).locator("strong")
  ).toHaveText("Free");
  await page.getByLabel("Published on the site").check();
  // A refused save keeps what was typed (React 19 resets forms by default).
  await page.getByLabel("Web address").fill("Cupping With Annika");
  await page.getByRole("button", { name: "Add Event" }).click();
  await expect(page.getByText("Some fields need a fix.")).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("Cupping with Annika");
  await expect(page.getByLabel("About the Event")).toHaveValue(
    "**Free**, eight seats."
  );
  await expect(page.getByLabel("Published on the site")).toBeChecked();
  await page.getByLabel("Web address").fill("cupping-with-annika");
  await page.getByRole("button", { name: "Add Event" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Cupping with Annika"
  );
  await expectNoAxeViolations(page);
  await expect(async () => {
    await page.goto("/events");
    await expect(
      page.getByRole("heading", { name: "Cupping with Annika" })
    ).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 150_000 });
});
