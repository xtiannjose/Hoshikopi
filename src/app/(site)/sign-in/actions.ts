"use server";

import { headers } from "next/headers";

import { clientIp, takeToken } from "@/lib/rate-limit";
import { redirect } from "next/navigation";

import { emailSignInLink, googleSignInUrl } from "@/modules/identity";

export type SignInState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string; email: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIFTEEN_MINUTES = 15 * 60;

export async function requestSignInLink(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return {
      status: "error",
      message: "Enter an email address, like hoshi@example.com.",
      email,
    };
  }
  const ip = clientIp(await headers());
  const allowed =
    (await takeToken(`link:${email}`, 3, FIFTEEN_MINUTES)) &&
    (await takeToken(`link-ip:${ip}`, 30, FIFTEEN_MINUTES));
  if (!allowed) {
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

/** Starts Google sign-in when its keys are set (ACC-01). */
export async function googleSignInAction(form: FormData) {
  const url = await googleSignInUrl(String(form.get("next") ?? ""));
  if (url) redirect(url);
}
