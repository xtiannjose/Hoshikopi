import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { expect, type Page } from "@playwright/test";

import { e2eQuery } from "./db";
const MAIL = path.join(process.cwd(), "data", "mail");

/** The sign-in link in the outbox whose return path carries `nonce`. */
async function linkFor(nonce: string): Promise<string | null> {
  const files = await readdir(MAIL).catch(() => []);
  for (const file of files) {
    const text = await readFile(path.join(MAIL, file), "utf8");
    const url = text.match(/https?:\/\/\S+/)?.[0];
    if (url?.includes(nonce)) return url;
  }
  return null;
}

/**
 * Specs sign the same Staff in many times per run; the 3-links-per-email
 * limit is for people, so clear it in the e2e database first.
 */
async function clearLinkLimits(email: string) {
  await e2eQuery("DELETE FROM rate_limits WHERE key = $1 OR key LIKE $2", [
    `link:${email}`,
    "link-ip:%",
  ]);
}

/**
 * Signs in through the real email-link flow. A nonce in the return path
 * tells this test's link apart from links other tests asked for at once.
 */
export async function signIn(page: Page, email: string, next = "/account") {
  await clearLinkLimits(email);
  const nonce = Math.random().toString(36).slice(2);
  const target = `${next}${next.includes("?") ? "&" : "?"}t=${nonce}`;
  await page.goto(`/sign-in?next=${encodeURIComponent(target)}`);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Email me a link" }).click();
  await expect(page.getByRole("status")).toContainText(email);
  let url: string | null = null;
  await expect
    .poll(async () => (url = await linkFor(nonce)), { timeout: 10_000 })
    .not.toBeNull();
  await page.goto(url!);
  await expect(page).toHaveURL(new RegExp(`t=${nonce}`));
  expect(page.url()).not.toContain("error=");
}
