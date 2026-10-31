import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createOTP } from "@better-auth/utils/otp";
import { expect, type Page } from "@playwright/test";
import { symmetricDecrypt } from "better-auth/crypto";

import { e2eQuery } from "./db";

// The e2e server's BETTER_AUTH_SECRET (playwright.config.ts).
const E2E_AUTH_SECRET = "e2e-secret-at-least-32-characters-long";
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
 * Specs sign the same Staff in many times per run; the link and Second
 * Factor limits are for people, so clear them in the e2e database first.
 */
async function clearLinkLimits(email: string) {
  await e2eQuery(
    "DELETE FROM rate_limits WHERE key = $1 OR key LIKE $2 OR key LIKE $3",
    [`link:${email}`, "link-ip:%", "second-factor:%"]
  );
}

/** Types the code Staff's authenticator would show, from the e2e database. */
async function enterSecondFactor(page: Page, email: string) {
  const code = page.getByLabel("6-digit code");
  await expect(code).toBeVisible();
  const { rows } = await e2eQuery(
    `SELECT f.secret FROM two_factors f JOIN users u ON u.id = f.user_id
     WHERE u.email = $1`,
    [email]
  );
  const secret = await symmetricDecrypt({
    key: E2E_AUTH_SECRET,
    data: rows[0].secret,
  });
  await code.fill(await createOTP(secret).totp());
  await page.getByRole("button", { name: "Continue" }).click();
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
  // Staff pages ask for the Second Factor once per session (ADR 0014).
  if (next.startsWith("/manage")) {
    await page.goto(`/manage/two-factor?next=${encodeURIComponent(target)}`);
    await enterSecondFactor(page, email);
  }
  await expect(page).toHaveURL(new RegExp(`t=${nonce}`));
  expect(page.url()).not.toContain("error=");
}
