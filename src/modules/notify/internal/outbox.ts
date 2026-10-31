import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { now } from "@/lib/clock";

export type Email = { to: string; subject: string; text: string };

/**
 * Until Resend is set up (batch 2.6), emails go to the terminal and, off
 * Vercel, to data/mail/ where end-to-end tests read sign-in links.
 */
export async function send(email: Email): Promise<void> {
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
