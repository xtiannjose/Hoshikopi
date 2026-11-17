import { expect, test } from "@playwright/test";

import { openAllDayToday } from "./db";
import { addToCart, placeGuestOrder } from "./order";
import { signIn } from "./sign-in";

// Motion on (docs/05 section 7): the config turns it off for every other
// test, so axe never sees a frame mid-fade. These turn it on, so a fade that
// swallows taps or an arrival that replays fails here (audit motion:12).
test.use({ reducedMotion: "no-preference" });

test.beforeEach(openAllDayToday);

// While the page fades in, taps on it are dropped, so the fade stays short
// and starts at once (audit motion:3).
test("a page change lets taps through within 200 ms (audit motion:3)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "once is enough");
  await page.goto("/menu/pastries");
  await page.getByRole("link", { name: "Ube Pandesal" }).click();
  // React lists the same animations to time its View Transitions.
  const fade = await page.waitForFunction(
    () => {
      const ends = document
        .getAnimations()
        .filter((animation) =>
          (
            animation.effect as KeyframeEffect | null
          )?.pseudoElement?.startsWith("::view-transition-new")
        )
        .map((animation) =>
          Number(animation.effect!.getComputedTiming().endTime)
        );
      return ends.length > 0 && Math.max(...ends);
    },
    undefined,
    { polling: "raf" }
  );
  const endTime = await fade.jsonValue();
  expect(endTime).toBeLessThanOrEqual(200);
});

// Playwright retries a click until it lands, so the bound on the fade is
// what fails when taps are dropped for too long (docs/05 section 7).
test("with motion on, a tap right after opening a Menu Item from the menu lands (audit motion:12, motion:3)", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const ends: number[] = [];
    Object.assign(window, { fadeEnds: ends });
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (options) => {
      const transition = start(options);
      // React reads the same animations once the transition is ready. Only
      // the page's own fade, by its keyframes (fade-out out, rise in):
      // ::view-transition takes no taps, so a part's default 250 ms
      // crossfade never holds a tap back.
      transition.ready.then(
        () => {
          const times = document.documentElement
            .getAnimations({ subtree: true })
            .filter((animation) =>
              ["fade-out", "rise"].includes(
                (animation as CSSAnimation).animationName
              )
            )
            .map((animation) =>
              Number(animation.effect!.getComputedTiming().endTime)
            );
          ends.push(Math.max(0, ...times));
        },
        () => {}
      );
      return transition;
    };
  });
  await page.goto("/menu");
  await page
    .locator("[data-menu-item]")
    .getByRole("link", { name: "Hoshi Latte", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/menu\/item\/hoshi-latte$/);
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added");

  // The first transition is the page change to the Menu Item. Above 0: the
  // page really faded. At most 200 ms, the motion:3 bound above: docs/05
  // section 7 gives the page change 160 ms.
  const ends = await page.evaluate(
    () => (window as unknown as { fadeEnds: number[] }).fadeEnds
  );
  expect(ends[0]).toBeGreaterThan(0);
  expect(ends[0]).toBeLessThanOrEqual(200);
});

test("with motion on, a new Order slides onto the Bar Screen once (audit motion:12)", async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  test.setTimeout(90_000);
  const bar = await (await browser.newContext()).newPage();
  await signIn(bar, "annika@hoshikopi.example", "/bar");
  // The test owns the Bar Screen's clock: each runFor below is one poll, and
  // the 4 s glow ends only when the test says. Pause once the poller runs.
  await bar.clock.install();
  const first = bar.waitForRequest(/\/api\/bar/);
  await bar.reload();
  await first;
  await bar.clock.pauseAt(await bar.evaluate(() => Date.now() + 1_000));
  await bar.evaluate(() => {
    const arrivals: { label: string | null; ms: unknown }[] = [];
    Object.assign(window, { arrivals });
    document.addEventListener("animationstart", (event) => {
      if (event.animationName !== "arrive") return;
      const card = event.target as Element;
      const arrive = card
        .getAnimations()
        .find(
          (animation) => (animation as CSSAnimation).animationName === "arrive"
        );
      // The whole run, not one loop: an infinite arrive would read Infinity.
      arrivals.push({
        label: card.getAttribute("aria-label"),
        ms: arrive?.effect?.getComputedTiming().activeDuration,
      });
    });
  });

  const guest = await (await browser.newContext()).newPage();
  const arrive = async (name: string) => {
    await addToCart(guest, "kopi-hitam");
    await placeGuestOrder(guest, name);
    const code = await guest.getByRole("heading", { level: 1 }).innerText();
    await bar.clock.runFor(3_000);
    const card = bar.getByRole("article", { name: `Order ${code}` });
    await expect(card).toHaveClass(/animate-arrive/);
    return { code, card };
  };
  const one = await arrive("Rio");
  // A second Order lands while the first still glows (motion:5): the board
  // re-renders, and the first card must not slide in again.
  const two = await arrive("Ria");
  await expect(one.card).toHaveClass(/animate-arrive/);
  // Each glow clears on its own 4 s timer.
  await bar.clock.runFor(5_000);
  await expect(one.card).not.toHaveClass(/animate-arrive/);
  await expect(two.card).not.toHaveClass(/animate-arrive/);

  // Once each, at full length (reduced motion would make it 0.01 ms).
  const arrivals = await bar.evaluate(
    () =>
      (window as unknown as { arrivals: { label: string | null }[] }).arrivals
  );
  for (const { code } of [one, two]) {
    expect(arrivals.filter((a) => a.label === `Order ${code}`)).toEqual([
      { label: `Order ${code}`, ms: 700 },
    ]);
  }
});
