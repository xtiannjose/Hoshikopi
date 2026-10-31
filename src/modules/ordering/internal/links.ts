import { createHash, createHmac } from "node:crypto";

// The status link carries a token derived from the Order id with a server
// secret, so any email can rebuild the link later; the database stores only
// the token's hash.

function secret(): string {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is not set");
  return value;
}

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** The link token for an Order (43 characters, URL-safe). */
export function orderToken(orderId: string): string {
  return createHmac("sha256", secret())
    .update(`order-link:${orderId}`)
    .digest("base64url");
}

/** The Customer's status page link (docs/03 section 4). */
export function orderLink(orderId: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${site}/orders/${orderId}?t=${orderToken(orderId)}`;
}

/** True when `token` opens the Order whose token hash is `hash`. */
export function tokenMatches(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}
