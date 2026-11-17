"use server";

import { requireStaff, memberByEmail } from "@/modules/identity";
import { adjustStars, balance } from "@/modules/loyalty";

export type StarsState = {
  message?: string;
  ok?: boolean;
  /** The field the message is about, marked invalid. */
  field?: "email" | "stars";
  /** Typed values, kept after an error (React resets the form). */
  values?: { email: string; stars: string; reason: string };
  /** The Member's balance after the save, or now after a refusal. */
  balance?: number;
};

/** What the Star Card beside the form shows (12.4). */
export type MemberStars = {
  /** Empty when the Member gave none. */
  name: string;
  email: string;
  balance: number;
};

const REASONS = {
  not_allowed: "Only Managers adjust Stars.",
  reason_required: "Give a reason and a number of Stars other than 0.",
  below_zero: "That would take the balance below zero.",
  too_many: "Use up to 50 Stars at a time, either way.",
  self: "You can't adjust your own Stars. Ask another Manager.",
};

const stars = (n: number) => `${n} ${n === 1 ? "Star" : "Stars"}`;

/**
 * The Member behind an email and their balance, so the Manager sees whose
 * Star Card they are changing before they save (12.4).
 */
export async function findMemberStarsAction(
  email: string
): Promise<MemberStars | null> {
  await requireStaff("manager", "/manage/stars");
  const member = await memberByEmail(String(email));
  if (!member) return null;
  return {
    name: member.name,
    email: member.email,
    balance: await balance(member.id),
  };
}

/** A Manager adds or removes Stars with a reason (LOY-05). */
export async function adjustStarsAction(
  _prev: StarsState,
  form: FormData
): Promise<StarsState> {
  const staff = await requireStaff("manager", "/manage/stars");
  const values = {
    email: String(form.get("email") ?? ""),
    stars: String(form.get("stars") ?? ""),
    reason: String(form.get("reason") ?? ""),
  };
  const member = await memberByEmail(values.email);
  if (!member) {
    return { message: "No Member has that email.", field: "email", values };
  }
  const result = await adjustStars(
    member.id,
    Number(form.get("stars")),
    String(form.get("reason") ?? ""),
    { kind: "staff", id: staff.id, role: staff.role }
  );
  if (result.ok) {
    const now = await balance(member.id);
    const who = member.name ? `${member.name} now has` : "They now have";
    return {
      ok: true,
      message: `Saved for ${member.email}. ${who} ${stars(now)}.`,
      balance: now,
    };
  }
  if (result.reason === "below_zero") {
    const left = await balance(member.id);
    return {
      message: `${REASONS.below_zero} They have ${stars(left)} now.`,
      field: "stars",
      values,
      balance: left,
    };
  }
  return { message: REASONS[result.reason], values };
}
