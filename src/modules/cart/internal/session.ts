import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import type { CartOwner } from "./cart";

// The Guest Cart lives behind a random token in an HTTP-only cookie; the
// database keeps only its SHA-256 hash (docs/03 section 5). Members' Carts
// arrive with sign-in in batch 4.1.
const COOKIE = "hk_cart";
const THIRTY_DAYS = 30 * 24 * 60 * 60;

const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** The current browser's Cart owner, or null before anything was added. */
export async function currentCartOwner(): Promise<CartOwner | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? { guestTokenHash: hash(token) } : null;
}

/** The owner for a write; sets the cookie first if needed (Server Actions). */
export async function cartOwnerForWrite(): Promise<CartOwner> {
  const jar = await cookies();
  let token = jar.get(COOKIE)?.value;
  if (!token) {
    token = randomBytes(32).toString("base64url");
    jar.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: THIRTY_DAYS,
      path: "/",
    });
  }
  return { guestTokenHash: hash(token) };
}
