import { expect, type Page } from "@playwright/test";

/** Adds a Menu Item with its default Options to this browser's Cart. */
export async function addToCart(page: Page, slug: string, quantity = 1) {
  await page.goto(`/menu/item/${slug}`);
  for (let i = 1; i < quantity; i++) {
    await page.getByRole("button", { name: "One more" }).click();
  }
  await page.getByRole("button", { name: "Add to order" }).click();
  await expect(page.getByRole("status")).toContainText("Added");
}

/** Checks out as a Guest paying at pickup; ends on the Order page. */
export async function placeGuestOrder(page: Page, name = "Bea") {
  await page.goto("/checkout");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(`${name.toLowerCase()}@example.com`);
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/orders\/[\w-]+\?t=/);
  return new URL(page.url()).pathname.split("/").at(-1)!;
}
