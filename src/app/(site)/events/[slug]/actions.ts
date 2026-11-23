"use server";

import { headers } from "next/headers";

import { refreshPublic } from "@/lib/refresh";
import { botCheck } from "@/lib/bot-check";
import { siteUrl } from "@/lib/env";
import { limits } from "@/lib/limits";
import { clientIp } from "@/lib/rate-limit";
import {
  cancelSignup,
  confirmSignup,
  HOLD_MINUTES,
  SIGNUPS_PER_VISITOR,
  signUpForEvent,
} from "@/modules/content";
import { currentMember } from "@/modules/identity";
import { canEmail, sendEventSignup } from "@/modules/notify";

export type SignupState = {
  status: "idle" | "done" | "error";
  message?: string;
  errors?: Partial<Record<string, string>>;
  /** What was typed, kept after a refusal (React resets the form). */
  values?: { name: string; email: string; seats: string };
  email?: string;
  /** A Member's own email, or the live demo, needs no link: confirmed at once. */
  confirmed?: boolean;
  /** False on the live demo, which sends no emails (audit journeys:9). */
  emailed?: boolean;
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
  // A script that fills the trap field is told it worked (SEC1-06).
  const bot = botCheck(form);
  if (bot === "honeypot") {
    return {
      status: "done",
      email: values.email,
      confirmed: false,
      emailed: true,
    };
  }
  if (bot === "too_fast") {
    return {
      status: "error",
      message: "That was quick. Check your details, then sign up again.",
      values,
    };
  }
  const ip = clientIp(await headers());
  if (!(await limits.eventSignup(ip))) {
    return {
      status: "error",
      message: "Too many Sign-ups from here. Try again in an hour.",
      values,
    };
  }
  const slug = String(form.get("slug") ?? "");
  // The live demo sends no email, so no link could confirm it.
  const emailed = canEmail();
  const result = await signUpForEvent(slug, values, {
    key: ip,
    memberEmail: (await currentMember())?.email,
    confirmNow: !emailed,
  });
  if (!result.ok) {
    const message = {
      invalid: "Some fields need a fix.",
      closed: "Sign-up for this Event has closed.",
      // The live demo sends no email, so no inbox to check (audit DC-33).
      already: emailed
        ? "That email is already signed up for this Event. Check your inbox for the link."
        : "That email is already signed up for this Event.",
      full: "Fully booked, sorry. Every seat is taken.",
      visitor_limit: `That's ${SIGNUPS_PER_VISITOR} Sign-ups for this Event from here today. For more seats, email the cafe.`,
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
  const { confirmed } = result;
  const site = siteUrl();
  try {
    await sendEventSignup({
      to: result.signup.email,
      seats: result.signup.seats,
      event: result.event,
      link: `${site}/events/${result.event.slug}/signup/${result.signup.id}?t=${result.token}`,
      confirmed,
      holdMinutes: HOLD_MINUTES,
    });
  } catch (error) {
    // The Seats are held for HOLD_MINUTES either way, then go back.
    console.error("[signup] email not sent:", error);
  }
  // Seats left on the Event page.
  refreshPublic("events");
  return { status: "done", email: result.signup.email, confirmed, emailed };
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
    refreshPublic("events");
    return { status: "cancelled" };
  }
  const result = await confirmSignup(id, token);
  if (result.ok) return { status: "confirmed" };
  return {
    status: "error",
    message: {
      not_found: "This Sign-up is gone. Sign up again on the Event page.",
      expired: `This link waited more than ${HOLD_MINUTES} minutes, so the seats went back. Sign up again on the Event page.`,
      closed: "Sign-up for this Event has closed.",
    }[result.reason],
  };
}
