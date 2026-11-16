/**
 * The site's address for links in emails, feeds and JSON-LD. On Vercel a
 * missing variable is a deploy mistake, so it throws instead of sending
 * localhost links (audit architecture:21).
 */
export function siteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (value) return value;
  if (process.env.VERCEL) throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  return "http://localhost:3000";
}

/** The server secret behind sign-in, link tokens and the Second Factor. */
export function authSecret(): string {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is not set");
  return value;
}
