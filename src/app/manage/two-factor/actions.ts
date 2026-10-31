"use server";

import { redirect } from "next/navigation";

import {
  enterSecondFactor,
  staffAwaitingSecondFactor,
} from "@/modules/identity";

export type SecondFactorState = { message?: string };

const MESSAGES = {
  wrong: "That code didn't match. Type the newest code from your app.",
  too_many: "Too many tries. Wait 15 minutes, then try again.",
};

/** Staff enter the code from their authenticator app (ADR 0014). */
export async function secondFactorAction(
  _prev: SecondFactorState,
  form: FormData
): Promise<SecondFactorState> {
  const staff = await staffAwaitingSecondFactor(String(form.get("next")));
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  const result = await enterSecondFactor(staff.id, staff.sessionId, code);
  if (result === "ok") redirect(staff.next);
  return { message: MESSAGES[result] };
}
