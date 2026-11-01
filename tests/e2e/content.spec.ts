import { readdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { expectNoAxeViolations, openIn } from "./axe";
import { signIn } from "./sign-in";

const MAIL = path.join(process.cwd(), "data", "mail");

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
  await signIn(page, "christian@hoshikopi.example", "/manage/events/new");
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

test("Recurring Events list weekly and an Event adds to a calendar (EVT-03, EVT-04)", async ({
  page,
  request,
}) => {
  await page.goto("/events");
  const weekly = page.getByRole("region", { name: "Every week" });
  await expect(weekly).toContainText("Open mic");
  await expect(weekly).toContainText("Thursdays, 7:00 PM to 9:00 PM");
  await page.goto("/cafe");
  await expect(page.getByRole("region", { name: "Every week" })).toContainText(
    "Saturday cupping"
  );

  await page.goto("/events/latte-art-night");
  await expect(
    page.getByRole("link", { name: "Add to calendar" })
  ).toHaveAttribute("href", "/events/latte-art-night/calendar");
  const ics = await request.get("/events/latte-art-night/calendar");
  expect(ics.headers()["content-type"]).toBe("text/calendar; charset=utf-8");
  const body = await ics.text();
  expect(body).toContain("BEGIN:VEVENT");
  expect(body).toContain("SUMMARY:Latte art night");
});

test("a Customer sends an Inquiry and the Manager answers it (INFO-11)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  test.setTimeout(180_000);
  const name = `Lia ${Date.now()}`;
  await page.goto("/cafe");
  await page.getByRole("link", { name: "Send us an inquiry" }).click();
  await expect(page.getByLabel("What is it about?")).toHaveValue(
    "private_event"
  );
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Email").fill("lia@example.com");
  await page.getByLabel("Guests or drinks (optional)").fill("0");
  await page
    .getByLabel("Tell us about it")
    .fill("A small party, Friday night.");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  // A refusal keeps what was typed.
  await expect(
    page.getByText("Enter a number of guests from 1 to 500.")
  ).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveValue(name);
  await page.getByLabel("Guests or drinks (optional)").fill("20");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Salamat! Your inquiry is with the cafe."
  );

  await signIn(page, "christian@hoshikopi.example", "/manage/inquiries");
  const item = page.getByRole("listitem").filter({ hasText: name });
  await expect(item).toContainText(`Private event from ${name}`);
  await expect(item).toContainText("20 guests or drinks");
  await expectNoAxeViolations(page);
  await item.getByRole("button", { name: `Mark answered (${name})` }).click();
  await expect(item).toContainText("Answered");
});

test("a visitor signs up for an Event and the Manager sees it (EVT-02)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  test.setTimeout(180_000);
  const email = `signup-${Date.now()}@example.com`;
  await page.goto("/events/latte-art-night");
  const signup = page.getByRole("region", { name: "Sign up" });
  await expect(signup).toContainText("of 12 seats left.");
  await expect(signup).toContainText("Pay PHP 350 a seat at the door.");
  await signup.getByLabel("Your name").fill("Annika");
  await signup.getByLabel("Email").fill(email);
  await signup.getByLabel("Seats").selectOption("2");
  await signup.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByRole("status")).toContainText(
    `You're in! We emailed ${email} with the details.`
  );
  await expect
    .poll(async () => {
      const files = await readdir(MAIL).catch(() => []);
      return files.some((file) => file.endsWith(`${email}.txt`));
    })
    .toBe(true);

  // The same email can't take more seats.
  await page.reload();
  await signup.getByLabel("Your name").fill("Annika");
  await signup.getByLabel("Email").fill(email);
  await signup.getByRole("button", { name: "Sign up" }).click();
  await expect(
    page.getByText("That email is already signed up for this Event.")
  ).toBeVisible();

  await signIn(page, "christian@hoshikopi.example", "/manage/events");
  await page.getByRole("link", { name: "Latte art night" }).click();
  const list = page.getByRole("region", { name: "Sign-ups" });
  await expect(list).toContainText(email);
  await expect(list).toContainText("2 seats");
});
