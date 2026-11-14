import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";

import { db } from "@/lib/db";
import { sendSignInLink } from "@/modules/notify";

/** Google sign-in shows only once its OAuth keys are set (batch 4.1). */
export function googleEnabled(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  session: {
    // A signed copy of the session in a cookie saves a database read per
    // page; a sign-out elsewhere takes effect within 5 minutes.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // Links and Google start only from our Server Actions, which apply our
  // rate limits; those HTTP routes stay closed. So does every route this
  // site never uses: /update-user stored any name or image, skipping
  // updateProfile's checks (audit ID2-04, SEC1-08). Our own auth.api calls
  // are not routed, so this closes only the HTTP door. Open: the link and
  // Google callbacks, get-session, sign-out, ok and error.
  disabledPaths: [
    "/sign-in/magic-link",
    "/sign-in/social",
    "/sign-in/email",
    "/sign-up/email",
    "/update-user",
    "/update-session",
    "/delete-user",
    "/delete-user/callback",
    "/change-email",
    "/change-password",
    "/verify-password",
    "/request-password-reset",
    "/reset-password",
    "/send-verification-email",
    "/verify-email",
    "/link-social",
    "/unlink-account",
    "/list-accounts",
    "/account-info",
    "/get-access-token",
    "/refresh-token",
    "/list-sessions",
    "/revoke-session",
    "/revoke-sessions",
    "/revoke-other-sessions",
  ],
  socialProviders: googleEnabled()
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  plugins: [
    magicLink({
      // Better Auth allows 5 link checks a minute per IP by default. Many
      // phones share one carrier IP and a link is a single-use 32-character
      // token, so a looser limit is safe; sending links is limited by our
      // own Server Action.
      rateLimit: { window: 60, max: 60 },
      async sendMagicLink({ email, url }) {
        await sendSignInLink(email, url);
      },
    }),
    nextCookies(), // keep last: lets Server Actions set auth cookies
  ],
});
