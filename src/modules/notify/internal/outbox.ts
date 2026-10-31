import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { now } from "@/lib/clock";

export type Email = { to: string; subject: string; text: string };

/**
 * Sends through Resend's REST API when RESEND_API_KEY is set (no SDK).
 * Without a key, emails go to the terminal and data/mail/, where end-to-end
 * tests read them (docs/06-SETUP.md section 2); on Vercel they are dropped.
 * The seeded demo accounts never go to Resend: see below.
 */
export async function send(email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  // The seeded demo accounts use a reserved domain that never receives mail.
  const demo = email.to.endsWith("@hoshikopi.example");
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
    });
    if (!response.ok) {
      throw new Error(`Resend refused the email: ${response.status}`);
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
  console.log(`\n[email] to ${email.to}: ${email.subject}\n${email.text}\n`);
  const dir = path.join(process.cwd(), "data", "mail");
  await mkdir(dir, { recursive: true });
  const stamp = now().toISOString().replace(/[:.]/g, "-");
  await writeFile(
    // A random part: two emails to one address can share a millisecond.
    path.join(
      dir,
      `${stamp}-${randomBytes(3).toString("hex")}-${email.to}.txt`
    ),
    `To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`
  );
}
