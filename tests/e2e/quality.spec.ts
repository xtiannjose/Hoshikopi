import { expect, test } from "@playwright/test";

import { openIn } from "./axe";
import { openAllDayToday } from "./db";

const PAGES = [
  "/",
  "/menu",
  "/menu/item/hoshi-latte",
  "/cafe",
  "/events",
  "/news",
  "/concept",
  "/cart",
  "/checkout",
  "/sign-in",
];

test.describe("budgets (docs/05 section 11)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "phone", "measured once, on a phone");
  });

  for (const path of PAGES.slice(0, 7)) {
    test(`${path} loads under 170 kB of JavaScript`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      const bytes = await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .filter(
            (r) => (r as PerformanceResourceTiming).initiatorType === "script"
          )
          .reduce(
            (sum, r) => sum + (r as PerformanceResourceTiming).encodedBodySize,
            0
          )
      );
      expect(bytes).toBeLessThan(170_000);
    });
  }
});

// PRD section 8, metric 1: the menu to a Paid Order through the Test Mode
// checkout, on a phone slowed like Lighthouse's mobile run (4x CPU, slow
// 4G). The time prints as [metric] for docs/METRICS.md.
test("a Guest orders and pays end to end in under 60 s on a throttled phone (PRD section 8)", async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "measured once, on a phone");
  test.setTimeout(120_000);
  await openAllDayToday();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  const start = Date.now();
  await page.goto("/menu/item/kopi-hitam");
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added");
  await page.goto("/checkout");
  await page.getByText("GCash", { exact: true }).click();
  await page.getByLabel("Name").fill("Hoshi");
  await page.getByLabel("Email").fill("hoshi@example.com");
  await page.getByRole("button", { name: /Place order/ }).click();
  await page.getByRole("button", { name: /^Pay PHP/ }).click();
  await expect(page.getByText("Paid online (Test Mode).")).toBeVisible({
    timeout: 30_000,
  });
  const seconds = (Date.now() - start) / 1000;
  console.log(
    `[metric] throttled order, menu to Paid: ${seconds.toFixed(1)} s`
  );
  expect(seconds).toBeLessThan(60);
});

test.describe("reflow at 320 px (WCAG 1.4.10)", () => {
  test.use({ viewport: { width: 320, height: 640 } });
  // Skip first, so the desktop project never runs the database setup.
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "phone", "once is enough");
    await openAllDayToday();
  });

  for (const path of PAGES) {
    test(`${path} has no sideways scrolling`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test("the header fits 320 px with items in the Cart", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "once is enough");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/menu/item/hoshi-latte");
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("link", { name: /Cart 1 item/ })).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the skip link and a keyboard-only order", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a keyboard user on desktop");
  await page.goto("/menu/item/hoshi-latte");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" })
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  // Arrow keys move within a radio group; Tab moves between groups.
  const regular = page.getByRole("radio", { name: /Regular/ });
  await regular.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Large/ })).toBeChecked();
  await page.getByRole("button", { name: "Add to order" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Added");
});

test("under reduced motion, a Day and Night switch starts no transitions (audit motion:1)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "measured once, on a phone");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/menu");
  const started = await page.evaluate(() => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === "night" ? "day" : "night";
    // Reading the list flushes style, which is when transitions start.
    return document.getAnimations().filter((a) => a instanceof CSSTransition)
      .length;
  });
  expect(started).toBe(0);
});

test("under reduced motion, Add to order still shows Added on a phone (audit motion:2)", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "phone",
    "the button is the only sign there"
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/menu/item/kopi-hitam");
  await page.getByRole("button", { name: "Add to order" }).click();
  // aria-hidden (the status line is what screen readers hear), and
  // Playwright counts opacity 0 as visible, so read the opacity itself.
  await expect(
    page.locator("button span.animate-confirm", { hasText: "Added" })
  ).toHaveCSS("opacity", "1");
});

test("the Content-Security-Policy holds and nothing breaks it (ADR 0013)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "headers are the same");
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy"))
      violations.push(message.text());
  });
  for (const path of ["/", "/menu/item/hoshi-latte", "/cafe", "/checkout"]) {
    const response = await page.goto(path);
    const csp = response?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  }
  await page.goto("/menu/item/hoshi-latte");
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added");
  expect(violations).toEqual([]);
});

test("public pages ask search engines to stay away (ADR 0006)", async ({
  page,
}) => {
  for (const path of ["/", "/cafe", "/menu"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/
    );
  }
});

test("an unknown address keeps the site's frame and the Concept Notice (8.2)", async ({
  page,
}) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "This page could not be found" })
  ).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("link", { name: "See the menu" })).toBeVisible();
  await expect(
    page.getByRole("contentinfo").getByText(/Hoshikopi is a concept cafe/)
  ).toBeVisible();
});

// WCAG 1.4.3 covers placeholder text too (audit a11y:7).
test("placeholder text has 4.5:1 contrast in both palettes", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "once is enough");
  for (const palette of ["day", "night"] as const) {
    await openIn(page, palette, "/menu");
    const ratio = await page.getByRole("searchbox").evaluate((input) => {
      // A canvas turns any CSS colour (oklab, color-mix) into sRGB bytes.
      const rgba = (color: string) => {
        const ctx = document.createElement("canvas").getContext("2d")!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data];
      };
      const luminance = ([r, g, b]: number[]) => {
        const [lr, lg, lb] = [r, g, b].map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
      };
      const back = rgba(getComputedStyle(input).backgroundColor);
      const [r, g, b, a] = rgba(getComputedStyle(input, "::placeholder").color);
      const text = [r, g, b].map((v, i) => (v * a + back[i] * (255 - a)) / 255);
      const [hi, lo] = [luminance(text), luminance(back)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    });
    expect(ratio, palette).toBeGreaterThanOrEqual(4.5);
  }
});
