import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { e2eQuery } from "./db";
import { signIn } from "./sign-in";

test("a seeded Manager signs in to /manage", async ({ page }) => {
  await signIn(page, "christian@hoshikopi.example", "/manage");
  await expect(
    page.getByText("Signed in as Christian (Manager).")
  ).toBeVisible();
  // The Staff frame carries the Concept Notice too (audit tests:15).
  await expect(page.getByText("Hoshikopi is a concept cafe.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "About this concept" })
  ).toHaveAttribute("href", "/concept");
  await expectNoAxeViolations(page);
});

test("a seeded Barista signs in to /manage", async ({ page }) => {
  await signIn(page, "annika@hoshikopi.example", "/manage");
  await expect(page.getByText("Signed in as Annika (Barista).")).toBeVisible();
});

// The check runs inside a streamed Suspense boundary, so the status is
// already 200; the page shows not-found and is marked noindex.
test("a Member gets not-found from /manage", async ({ page }) => {
  await signIn(page, "hoshi@hoshikopi.example", "/");
  await page.goto("/manage");
  await expect(
    page.getByRole("heading", { name: /could not be found/i })
  ).toBeVisible();
  await expect(page.getByText(/Signed in as/)).toHaveCount(0);
});

test("signed out, /manage asks to sign in", async ({ page }) => {
  await page.goto("/manage");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmanage/);
});

test("Staff set up a Second Factor before /manage; the Bar Screen skips it (ADR 0014)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  // A new Barista, so no other test has enrolled them yet.
  const id = `e2e-${Date.now()}`;
  const email = `${id}@hoshikopi.example`;
  await e2eQuery(
    `INSERT INTO users (id, name, email, email_verified, role, updated_at)
     VALUES ($1, 'Lia', $2, true, 'barista', now())`,
    [id, email]
  );
  await signIn(page, email, "/bar");
  await expect(page).toHaveURL(/\/bar/);

  await page.goto("/manage");
  await expect(page).toHaveURL(/\/manage\/two-factor/);
  await expect(
    page.getByRole("heading", { name: "Set up your authenticator" })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR code for your authenticator app" })
  ).toBeVisible();
  await expectNoAxeViolations(page);

  const code = page.getByLabel("6-digit code");
  await code.fill("000000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("That code didn't match.")).toBeVisible();

  // What an authenticator app makes of the setup key.
  const key = (await page.locator("code").textContent())!.replace(/\s/g, "");
  const secret = new TextDecoder().decode(base32.decode(key));
  await code.fill(await createOTP(secret).totp());
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Signed in as Lia (Barista).")).toBeVisible();
});

test("a Manager reads the reports (STAFF-08)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  await signIn(page, "christian@hoshikopi.example", "/manage/reports");
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  for (const name of ["Sales by day", "Top Menu Items", "Stars"]) {
    await expect(
      page.getByRole("heading", { name, exact: true })
    ).toBeVisible();
  }
  await page.getByRole("link", { name: "Last 30 days" }).click();
  await expect(
    page.getByRole("link", { name: "Last 30 days" })
  ).toHaveAttribute("aria-current", "page");
  await expectNoAxeViolations(page);
});

test("a Manager makes a Member a Barista, then takes the role back (STAFF-10)", async ({
  page,
  browser,
}) => {
  // A fresh Member: the account exists once they have signed in.
  const email = `migs-${Date.now()}@example.com`;
  const member = await (await browser.newContext()).newPage();
  await signIn(member, email, "/account");

  await signIn(page, "christian@hoshikopi.example", "/manage/staff");
  await expect(
    page.getByRole("heading", { name: "Staff", exact: true })
  ).toBeVisible();
  await page.getByLabel("Email they signed in with").fill(email);
  await page.getByLabel("Role", { exact: true }).selectOption("barista");
  await page.getByRole("button", { name: "Give role" }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "is now a Barista."
  );

  const row = page.getByRole("listitem").filter({ hasText: email });
  await expect(row).toContainText("Barista");
  await expectNoAxeViolations(page);
  await row.getByRole("combobox").selectOption("customer");
  await row.getByRole("button", { name: /^Save role for/ }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "is now a Member" })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("listitem").filter({ hasText: email })
  ).toHaveCount(0);
  // The Manager's own row has no controls.
  await expect(
    page.getByRole("listitem").filter({ hasText: "(you)" }).getByRole("button")
  ).toHaveCount(0);
});

// Add Staff defaulted to Barista, so a Manager's email demoted them; and a
// row warned only before Member (audit staff:16).
test("Add Staff never demotes a Manager, and a row warns before any lower role", async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  const email = `bea-${Date.now()}@example.com`;
  const person = await (await browser.newContext()).newPage();
  await signIn(person, email, "/account");

  await signIn(page, "christian@hoshikopi.example", "/manage/staff");
  const add = async (role?: string) => {
    await page.getByLabel("Email they signed in with").fill(email);
    if (role) await page.getByLabel("Role", { exact: true }).selectOption(role);
    await page.getByRole("button", { name: "Give role" }).click();
  };
  await add("manager");
  await expect(page.getByRole("status").first()).toContainText(
    "is now a Manager."
  );
  await add();
  await expect(page.getByRole("status").first()).toContainText(
    "is already a Manager. To lower their role, use Save on their row in the team list."
  );

  const row = page.getByRole("listitem").filter({ hasText: email });
  await expect(row.getByRole("combobox")).toHaveValue("manager");
  await row.getByRole("combobox").selectOption("barista");
  await expect(
    row.getByText("They lose Manager access and are signed out now.")
  ).toBeVisible();
  await row.getByRole("combobox").selectOption("customer");
  await expect(
    row.getByText("They lose staff access and are signed out now.")
  ).toBeVisible();
  await row.getByRole("button", { name: /^Save role for/ }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "is now a Member" })
  ).toBeVisible();
});

// Nothing could be deleted, so test records stayed in every Staff list
// (audit staff:9). A Delete asks once, and only for what nothing uses.
test("a Manager deletes an unused Option Group and a draft Post, asked once", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  const key = `${testInfo.workerIndex}-${Date.now()}`;
  await e2eQuery(
    `INSERT INTO option_groups (id, name, min_select, max_select, updated_at)
     VALUES ($1, $2, 0, 1, now())`,
    [`og-${key}`, `Test toppings ${key}`]
  );
  await e2eQuery(
    `INSERT INTO posts (id, slug, title, excerpt, body_md, updated_at)
     VALUES ($1, $2, $3, 'Nothing yet.', 'Draft.', now())`,
    [`post-${key}`, `test-draft-${key}`, `Test draft ${key}`]
  );

  await signIn(
    page,
    "christian@hoshikopi.example",
    `/manage/menu/options/og-${key}`
  );
  await page.getByText("Delete this Option Group").click();
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Yes, delete it" }).click();
  await expect(page).toHaveURL(/\/manage\/menu$/);
  // The page it came from stays in the DOM, hidden, for Back.
  await expect(page.getByText(`Test toppings ${key}`)).toBeHidden();

  await page.goto(`/manage/posts/post-${key}`);
  await page.getByText("Delete this draft").click();
  await page.getByRole("button", { name: "Yes, delete it" }).click();
  await expect(page).toHaveURL(/\/manage\/posts$/);
  await expect(page.getByText(`Test draft ${key}`)).toBeHidden();
});

// A Manager could not remove a Sign-up, so fake ones kept their Seats, and
// lowering the Seats or unpublishing told nobody (audit staff:10, SEC2-02).
test("a Manager removes a Sign-up and is warned before stranding guests", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  const key = `${testInfo.workerIndex}-${Date.now()}`;
  const event = `ev-${key}`;
  const email = `fake-${key}@example.com`;
  await e2eQuery(
    `INSERT INTO events (id, slug, title, starts_at, ends_at, summary, body_md,
                         seats, is_published, updated_at)
     VALUES ($1, $2, $3, now() + interval '7 days',
             now() + interval '7 days 2 hours', 'One line.', 'Body.', 6, true, now())`,
    [event, `cupping-${key}`, `Cupping ${key}`]
  );
  await e2eQuery(
    `INSERT INTO event_signups (id, event_id, name, email, seats, confirmed_at)
     VALUES ($1, $2, 'Fake guest', $3, 4, now())`,
    [`su-${key}`, event, email]
  );

  await signIn(page, "christian@hoshikopi.example", `/manage/events/${event}`);
  const list = page.getByRole("region", { name: "Sign-ups" });
  await expect(list).toContainText("4 of 6 seats taken");
  await expect(
    list.getByRole("link", { name: "Email the confirmed guests (1)" })
  ).toHaveAttribute("href", `mailto:?bcc=${encodeURIComponent(email)}`);

  const status = page.getByRole("status").filter({ hasText: "Saved." });
  await page.getByLabel("Published on the site").uncheck();
  await page.getByRole("button", { name: "Save Event" }).click();
  await expect(status).toContainText(
    "It's off the site, and 1 Sign-up still holds Seats."
  );
  await page.getByLabel("Seats for Sign-ups here (optional)").fill("2");
  await page.getByRole("button", { name: "Save Event" }).click();
  await expect(status).toContainText(
    "4 Seats are already taken, more than the 2 you set."
  );

  await list.getByText("Remove Fake guest").click();
  await expectNoAxeViolations(page);
  await list.getByRole("button", { name: "Yes, remove them" }).click();
  await expect(list).toContainText("0 of 2 seats taken");
  await expect(list).not.toContainText(email);
});
