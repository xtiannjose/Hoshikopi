import { createHash, createHmac } from "node:crypto";

import { authSecret, siteUrl } from "@/lib/env";

// The status link carries a token derived from the Order id with a server
// secret, so any email can rebuild the link later; the database stores only
// the token's hash.

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** The link token for an Order (43 characters, URL-safe). */
export function orderToken(orderId: string): string {
  return createHmac("sha256", authSecret())
    .update(`order-link:${orderId}`)
    .digest("base64url");
}

/** The Customer's status page, without the site's origin, for lists. */
export function orderPath(orderId: string): string {
  return `/orders/${orderId}?t=${orderToken(orderId)}`;
}

/** The Customer's status page link (docs/03 section 4). */
export function orderLink(orderId: string): string {
  return `${siteUrl()}${orderPath(orderId)}`;
}

/** True when `token` opens the Order whose token hash is `hash`. */
export function tokenMatches(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}
