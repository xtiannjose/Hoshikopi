import { headers } from "next/headers";

import { auth } from "./auth";

/**
 * Only same-site paths, so `?next=` cannot redirect to another site. Control
 * characters and backslashes are refused: browsers drop tabs and newlines,
 * which would turn "/\t/evil.example" into "//evil.example".
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(next)) {
    return "/account";
  }
  const url = new URL(next, "https://same.site");
  return url.origin === "https://same.site" && !next.startsWith("//")
    ? next
    : "/account";
}

/** Email a sign-in link that returns to `next`. */
export async function emailSignInLink(email: string, next: string) {
  await auth.api.signInMagicLink({
    body: { email, callbackURL: safeNext(next) },
    headers: await headers(),
  });
}

/** Where to send the browser to sign in with Google (ACC-01). */
export async function googleSignInUrl(next: string): Promise<string | null> {
  const result = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: safeNext(next) },
    headers: await headers(),
  });
  return result.url ?? null;
}
