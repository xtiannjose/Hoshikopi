/**
 * The site's address for links in emails, feeds and JSON-LD. On Vercel's
 * Production a missing variable is a deploy mistake, so it throws instead
 * of sending localhost links (audit architecture:21). A Preview without it
 * links to its own deployment address, which Vercel always sets.
 */
export function siteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (value) return value;
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** The server secret behind sign-in, link tokens and the Second Factor. */
export function authSecret(): string {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is not set");
  return value;
}
