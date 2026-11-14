import { expect, test, type Page } from "@playwright/test";

import { e2eQuery, openAllDayToday } from "./db";

// Keyboard focus (7.8a): never hidden, never lost (audit a11y:1 to a11y:4).

test.beforeEach(openAllDayToday);

/**
 * Whether the focused control in main shows on screen: the point at its
 * centre is the control itself, or the label around a visually hidden one,
 * not a sticky bar over it. Null once focus has left main.
 */
function focusInMainShows(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el?.closest("main")) return null;
    const box = el.getBoundingClientRect();
    const hit = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2
    );
    return !!hit && (el.contains(hit) || !!hit.closest("label")?.contains(el));
  });
}

async function walk(page: Page, key: "Tab" | "Shift+Tab", steps: number) {
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press(key);
    const shows = await focusInMainShows(page);
    if (shows === null) break;
    expect(shows, `step ${i + 1} is covered`).toBe(true);
  }
}

test("Tab through a Menu Item never hides focus under the Add to order bar (a11y:1)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "the bar sticks on phones");
  await page.goto("/menu/item/hoshi-latte");
  await page.getByRole("radio").first().focus();
  await walk(page, "Tab", 20);
});

test("Shift+Tab up the menu never hides focus under the Category tabs (a11y:1)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "once, at 1280 px");
  await page.goto("/menu");
  await page.locator("footer a").first().focus();
  await walk(page, "Shift+Tab", 30);
});

test("the Cart drawer takes focus, gives it back on Esc and closes when Tab leaves (a11y:2)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a keyboard user on desktop");
  await page.goto("/menu/item/kopi-hitam");
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added");
  const pill = page.getByRole("button", { name: /^Your Cart/ });
  const drawer = page.getByRole("dialog", { name: "Your Cart" });
  const close = page.getByRole("button", { name: "Close your Cart" });

  await pill.focus();
  await page.keyboard.press("Enter");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(pill).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(drawer).toBeHidden();
});

test("the phone menu takes focus and closes when Tab leaves it (a11y:2)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "the menu button is for phones");
  await page.goto("/");
  await page.getByRole("button", { name: "Open the menu" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Close the menu" })
  ).toBeFocused();
  // Back past the logo, the first thing in it.
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#site-menu")).toBeHidden();
});

test("after a link, focus starts in the new page (a11y:3)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a keyboard user on desktop");
  await page.goto("/menu");
  await page.locator('main a[href^="/menu/item/"]').first().focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/menu\/item\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await focusInMainShows(page)).not.toBeNull();
});

test("a refused sign-in or Event Sign-up takes focus to the field to fix (a11y:4)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a keyboard user on desktop");
  await page.goto("/sign-in");
  const email = page.getByRole("textbox", { name: "Email" });
  await email.fill("hoshi@");
  await page.getByRole("button", { name: "Email me a link" }).click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAccessibleDescription(/Enter an email address/);

  await e2eQuery("DELETE FROM rate_limits WHERE key LIKE 'signup-%'");
  await page.goto("/events/latte-art-night");
  const signup = page.getByRole("region", { name: "Sign up" });
  await signup.getByRole("button", { name: "Sign up" }).click();
  await expect(signup.getByLabel("Your name")).toBeFocused();
});
