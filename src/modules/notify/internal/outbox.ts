import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { now } from "@/lib/clock";

export type Email = { to: string; subject: string; text: string };

/** The seeded demo accounts' reserved domain, which never receives mail. */
export const isDemoAccount = (to: string) => to.endsWith("@hoshikopi.example");

/**
 * The local outbox (the terminal and data/mail/) is for development and the
 * tests, which set MAIL_OUTBOX=1 (Playwright runs a production build). A
 * self-hosted production server without Resend kept every sign-in and Order
 * link in files nobody pruned (audit DATA-10); there it is off.
 */
export const localOutbox = (env: NodeJS.ProcessEnv = process.env) =>
  !env.VERCEL && (env.MAIL_OUTBOX === "1" || env.NODE_ENV === "development");

/**
 * Whether an email to a real address goes anywhere: Resend is set up, or
 * the local outbox is on. False on the live demo until Resend has a domain
 * (audit journeys:9), so the site must not say an email was sent.
 */
export function canEmail(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.RESEND_API_KEY) || localOutbox(env);
}

/**
 * Sends through Resend's REST API when RESEND_API_KEY is set (no SDK).
 * Without a key, emails go to the terminal and data/mail/, where end-to-end
 * tests read them (docs/06-SETUP.md section 2); on Vercel they are dropped.
 * The seeded demo accounts never go to Resend: see below.
 */
export async function send(email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const demo = isDemoAccount(email.to);
  if (key && !demo) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "Hoshikopi <onboarding@resend.dev>",
        to: [email.to],
        subject: email.subject,
        text: email.text,
      }),
      // It runs inside the Ready tap, the webhook and checkout (ops:6).
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      throw new Error(
        `Resend refused the email: ${response.status} ${await response.text()}`
      );
    }
    return;
  }
  if (process.env.VERCEL) {
    // ADR 0005: sign-in links never sit in hosting logs, except a demo
    // account's, which only the project's owner can read there.
    if (demo) {
      console.log(
        `[email] demo account ${email.to}: ${email.subject}\n${email.text}`
      );
      return;
    }
    console.error(
      `[email] not sent, RESEND_API_KEY is missing: ${email.subject}`
    );
    return;
  }
  if (!localOutbox()) {
    console.error(
      `[email] not sent: no RESEND_API_KEY, and the local outbox is off: ${email.subject}`
    );
    return;
  }
  console.log(`\n[email] to ${email.to}: ${email.subject}\n${email.text}\n`);
  // Test runs point MAIL_DIR at their own folder (playwright.config.ts,
  // vitest.config.mts), so data/mail stays the developer's own outbox.
  const dir = process.env.MAIL_DIR ?? path.join(process.cwd(), "data", "mail");
  await mkdir(dir, { recursive: true });
  const stamp = now().toISOString().replace(/[:.]/g, "-");
  // Only these characters reach the file name, so no address (an Event
  // Sign-up email holding "../", say) can write outside data/mail.
  const to = email.to.replace(/[^\w@.+-]/g, "_");
  await writeFile(
    // A random part: two emails to one address can share a millisecond.
    path.join(dir, `${stamp}-${randomBytes(3).toString("hex")}-${to}.txt`),
    `To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`
  );
}
