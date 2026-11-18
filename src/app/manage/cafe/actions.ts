"use server";

import { refreshPublic } from "@/lib/refresh";
import { saveCafeDetails } from "@/modules/cafe";
import { requireStaff } from "@/modules/identity";

export type CafeFormState = {
  status: "idle" | "saved" | "error";
  errors?: Partial<Record<string, string>>;
};

export async function saveCafeAction(
  _prev: CafeFormState,
  formData: FormData
): Promise<CafeFormState> {
  const staff = await requireStaff("manager", "/manage/cafe");
  const result = await saveCafeDetails(Object.fromEntries(formData), staff);
  if (!result.ok) return { status: "error", errors: result.errors };
  // /cafe, Home and the footer read the cafe's details under "hours".
  refreshPublic("hours");
  return { status: "saved" };
}
