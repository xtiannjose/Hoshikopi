"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { deleteMemberCart } from "@/modules/cart";
import {
  forgetMember,
  requireMember,
  signOut,
  updateProfile,
} from "@/modules/identity";
import { forgetStars } from "@/modules/loyalty";
import { deidentifyOrders } from "@/modules/ordering";

export async function signOutAction() {
  await signOut();
  refresh();
  redirect("/");
}

/** Your details: name and the marketing opt-in (ACC-03). */
export async function updateProfileAction(form: FormData) {
  const member = await requireMember("/account");
  await updateProfile(member.id, {
    name: String(form.get("name") ?? ""),
    marketingOptIn: form.get("marketingOptIn") === "on",
  });
  refresh();
}

/**
 * Delete my account (ACC-03): Orders stay for the cafe's records without
 * the person; Stars, the Cart and the sign-in go.
 */
export async function deleteAccountAction() {
  const member = await requireMember("/account");
  await deidentifyOrders(member.id);
  await forgetStars(member.id);
  await deleteMemberCart(member.id);
  await signOut();
  await forgetMember(member.id);
  refresh();
  redirect("/");
}
