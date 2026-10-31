import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { now } from "@/lib/clock";

export type Email = { to: string; subject: string; text: string };

/**
 * Sends through Resend's REST API when RESEND_API_KEY is set (no SDK).
 * Without a key, emails go to the terminal and, off Vercel, to data/mail/
 * where end-to-end tests read them (docs/06-SETUP.md section 2).
 */
export async function send(email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (key) {
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
  console.log(`\n[email] to ${email.to}: ${email.subject}\n${email.text}\n`);
  if (process.env.VERCEL) return;
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
