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
  // rate limits; these HTTP routes stay closed.
  disabledPaths: ["/sign-in/magic-link", "/sign-in/social"],
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
