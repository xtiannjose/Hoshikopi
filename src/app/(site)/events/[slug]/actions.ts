"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";

import { clientIp, takeToken } from "@/lib/rate-limit";
import { signUpForEvent } from "@/modules/content";
import { sendEventSignup } from "@/modules/notify";

export type SignupState = {
  status: "idle" | "done" | "error";
  message?: string;
  errors?: Partial<Record<string, string>>;
  /** What was typed, kept after a refusal (React resets the form). */
  values?: { name: string; email: string; seats: string };
  email?: string;
};

/** Sign up for an Event with Seats (EVT-02); confirmed by email. */
export async function signUpAction(
  _prev: SignupState,
  form: FormData
): Promise<SignupState> {
  const values = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    seats: String(form.get("seats") ?? ""),
  };
  if (!(await takeToken(`signup-ip:${clientIp(await headers())}`, 10, 3600))) {
    return {
      status: "error",
      message: "Too many Sign-ups from here. Try again in an hour.",
      values,
    };
  }
  const slug = String(form.get("slug") ?? "");
  const result = await signUpForEvent(slug, values);
  if (!result.ok) {
    const message = {
      invalid: "Some fields need a fix.",
      closed: "Sign-up for this Event has closed.",
      already: "That email is already signed up for this Event.",
      full: "Fully booked, sorry. Every seat is taken.",
      too_many_seats:
        "seatsLeft" in result
          ? `Only ${result.seatsLeft} ${result.seatsLeft === 1 ? "seat is" : "seats are"} left. Choose fewer.`
          : "",
    }[result.reason];
    return {
      status: "error",
      message,
      errors: "errors" in result ? result.errors : undefined,
      values,
    };
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    await sendEventSignup({
      to: result.signup.email,
      name: result.signup.name,
      seats: result.signup.seats,
      event: result.event,
      link: `${site}/events/${result.event.slug}`,
    });
  } catch (error) {
    // The seat is taken either way; the Manager sees it in /manage.
    console.error("[signup] email not sent:", error);
  }
  // Seats left on the Event page.
  updateTag("content");
  return { status: "done", email: result.signup.email };
}
