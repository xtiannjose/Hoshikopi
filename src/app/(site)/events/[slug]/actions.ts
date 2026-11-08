"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";

import { clientIp, takeToken } from "@/lib/rate-limit";
import { cancelSignup, confirmSignup, signUpForEvent } from "@/modules/content";
import { currentMember } from "@/modules/identity";
import { sendEventSignup } from "@/modules/notify";

export type SignupState = {
  status: "idle" | "done" | "error";
  message?: string;
  errors?: Partial<Record<string, string>>;
  /** What was typed, kept after a refusal (React resets the form). */
  values?: { name: string; email: string; seats: string };
  email?: string;
  /** A Member's own email needs no link: confirmed at once. */
  confirmed?: boolean;
};

/** Sign-ups that went through, per visitor per Event per day (8.7). */
const PER_VISITOR = 2;

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
  const ip = clientIp(await headers());
  if (!(await takeToken(`signup-ip:${ip}`, 10, 3600))) {
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
      already:
        "That email is already signed up for this Event. Check your inbox for the link.",
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
  // Only Sign-ups that went through count, so a typo costs nothing; one
  // past the limit is undone (SEC2-02: one visitor can't book out an Event).
  const key = `signup-event:${result.event.slug}:${ip}`;
  if (!(await takeToken(key, PER_VISITOR, 86_400))) {
    await cancelSignup(result.signup.id, result.token);
    return {
      status: "error",
      message: `That's ${PER_VISITOR} Sign-ups for this Event from here today. For more seats, email the cafe.`,
      values,
    };
  }
  // A signed-in Member's email is proven already (a link or Google), so
  // their own address needs no link; anyone else's waits for it.
  const member = await currentMember();
  const confirmed =
    member?.email.toLowerCase() === result.signup.email &&
    (await confirmSignup(result.signup.id, result.token)).ok;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    await sendEventSignup({
      to: result.signup.email,
      seats: result.signup.seats,
      event: result.event,
      link: `${site}/events/${result.event.slug}/signup/${result.signup.id}?t=${result.token}`,
      confirmed,
    });
  } catch (error) {
    // The Seats are held for 30 minutes either way, then go back.
    console.error("[signup] email not sent:", error);
  }
  // Seats left on the Event page.
  updateTag("content");
  return { status: "done", email: result.signup.email, confirmed };
}

export type AnswerState = {
  status: "idle" | "confirmed" | "cancelled" | "error";
  message?: string;
};

/** The guest's email link confirms or cancels their Sign-up (8.7). */
export async function answerSignupAction(
  _prev: AnswerState,
  form: FormData
): Promise<AnswerState> {
  const id = String(form.get("id") ?? "");
  const token = String(form.get("t") ?? "");
  if (form.get("intent") === "cancel") {
    const result = await cancelSignup(id, token);
    if (!result.ok) {
      return { status: "error", message: "This Sign-up is already gone." };
    }
    // The Seats show as free again on the Event page.
    updateTag("content");
    return { status: "cancelled" };
  }
  const result = await confirmSignup(id, token);
  if (result.ok) return { status: "confirmed" };
  return {
    status: "error",
    message: {
      not_found: "This Sign-up is gone. Sign up again on the Event page.",
      expired:
        "This link waited more than 30 minutes, so the seats went back. Sign up again on the Event page.",
      closed: "Sign-up for this Event has closed.",
    }[result.reason],
  };
}
