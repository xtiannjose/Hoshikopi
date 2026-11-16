import { now } from "@/lib/clock";

/** The hidden fields <BotFields> adds to a public form. */
export const TRAP_FIELD = "website";
export const STARTED_FIELD = "started";

/**
 * A light check against scripted posts on the Inquiry and Sign-up forms
 * (audit SEC1-06): a field people never see stays empty, and a person
 * takes more than 2 seconds. A form without a start time (no JavaScript)
 * passes. The end-to-end run sets FORM_MIN_FILL_MS=0: Playwright types in
 * an instant.
 */
export function botCheck(
  form: FormData,
  at: Date = now()
): "honeypot" | "too_fast" | null {
  if (String(form.get(TRAP_FIELD) ?? "") !== "") return "honeypot";
  const started = Number(form.get(STARTED_FIELD));
  const least = Number(process.env.FORM_MIN_FILL_MS || 2_000);
  if (started > 0 && at.getTime() - started < least) return "too_fast";
  return null;
}
