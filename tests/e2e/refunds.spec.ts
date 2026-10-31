import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./axe";
import { e2eQuery, openAllDayToday } from "./db";
import { addToCart } from "./order";
import { signIn } from "./sign-in";

test.beforeEach(openAllDayToday);

test("a Manager refunds a paid Order in full (PAY-05, STAFF-07)", async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop task");
  test.setTimeout(90_000);
  const guest = await (await browser.newContext()).newPage();
  await addToCart(guest, "kopi-hitam");
  await guest.goto("/checkout");
  await guest.getByText("Card", { exact: true }).click();
  await guest.getByLabel("Name").fill("Migs");
  await guest.getByLabel("Email").fill("migs@example.com");
  await guest.getByRole("button", { name: /Place order/ }).click();
  await guest.getByRole("button", { name: /^Pay PHP/ }).click();
  await expect(guest.getByRole("status")).toHaveText(
    "Payment received. The bar starts on it soon.",
    { timeout: 10_000 }
  );
  const code = await guest.getByRole("heading", { level: 1 }).innerText();
  // Stands in for the bar handing it over.
  await e2eQuery(
    "UPDATE orders SET status = 'picked_up', picked_up_at = now(), updated_at = now() WHERE code = $1 AND service_day = (now() AT TIME ZONE 'Asia/Manila')::date",
    [code]
  );

  const manager = await (await browser.newContext()).newPage();
  await signIn(manager, "hoshi@hoshikopi.example", "/manage/orders");
  await expectNoAxeViolations(manager);
  await manager.getByText(`Refund ${code}`, { exact: true }).click();
  await manager.getByRole("button", { name: `Yes, refund ${code}` }).click();
  await expect(
    manager.getByRole("row").filter({ hasText: code })
  ).toContainText("Refunded");
  // The page stops polling once an Order is Picked Up (ADR 0009).
  await guest.reload();
  await expect(guest.getByRole("status")).toHaveText(
    "This order was refunded in full."
  );
});
