import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { currentMember } from "@/modules/identity";

import { mergeGuestCart, type CartOwner } from "./cart";

// The Guest Cart lives behind a random token in an HTTP-only cookie; the
// database keeps only its SHA-256 hash (docs/03 section 5). A signed-in
// Member's Cart is keyed by the Member.
const COOKIE = "hk_cart";
const THIRTY_DAYS = 30 * 24 * 60 * 60;

const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/**
 * The current Cart owner: the signed-in Member, whose Cart takes in any Guest
 * Cart left in this browser; otherwise the Guest, or null before anything
 * was added.
 */
export async function currentCartOwner(): Promise<CartOwner | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const member = await currentMember();
  if (member) {
    if (token) await mergeGuestCart({ guestTokenHash: hash(token) }, member.id);
    return { memberId: member.id };
  }
  return token ? { guestTokenHash: hash(token) } : null;
}

/** The owner for a write; sets the cookie first if needed (Server Actions). */
export async function cartOwnerForWrite(): Promise<CartOwner> {
  const signedIn = await currentCartOwner();
  if (signedIn && "memberId" in signedIn) return signedIn;
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
