"use server";

import { headers } from "next/headers";

import { limits } from "@/lib/limits";
import { clientIp } from "@/lib/rate-limit";
import { isPlainText } from "@/lib/text";
import { redirect } from "next/navigation";

import { emailSignInLink, googleSignInUrl, safeNext } from "@/modules/identity";
import { canEmail, isDemoAccount } from "@/modules/notify";

export type SignInState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestSignInLink(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL.test(email) || !isPlainText(email) || email.length > 254) {
    return {
      status: "error",
      message: "Enter an email address, like hoshi@example.com.",
      email,
    };
  }
  // The live demo sends no emails until Resend has a domain; only the
  // seeded demo accounts' links reach the owner's logs (ADR 0005).
  if (!canEmail() && !isDemoAccount(email)) {
    return {
      status: "error",
      message:
        "Email links are switched off on this demo. Continue with Google instead.",
      email,
    };
  }
  const ip = clientIp(await headers());
  // A stranger on another connection uses up only their own share, so the
  // person keeps links of their own (audit ID2-05, DC-09).
  if (!(await limits.signInLink(email, ip))) {
    return {
      status: "error",
      message: "Too many links asked for. Try again in 15 minutes.",
      email,
    };
  }
  try {
    await emailSignInLink(email, String(formData.get("next") ?? ""));
    return { status: "sent", email };
  } catch (error) {
    console.error("[sign-in] link not sent:", error);
    return {
      status: "error",
      message: "We couldn't send the link. Try again in a minute.",
      email,
    };
  }
}

/**
 * Starts Google sign-in when its keys are set (ACC-01), 30 per IP in 15
 * minutes: each start writes a verifications row for Google's state (audit
 * ID2-10).
 */
export async function googleSignInAction(form: FormData) {
  const next = safeNext(String(form.get("next") ?? ""));
  const ip = clientIp(await headers());
  if (!(await limits.googleSignIn(ip))) {
    redirect(`/sign-in?${new URLSearchParams({ next, google: "limited" })}`);
  }
  const url = await googleSignInUrl(next);
  if (url) redirect(url);
}
