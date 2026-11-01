"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import {
  addLine,
  deleteMemberCart,
  favouritesFor,
  removeFavourite,
} from "@/modules/cart";
import {
  forgetMember,
  requireMember,
  signOut,
  updateProfile,
} from "@/modules/identity";
import { forgetStars } from "@/modules/loyalty";
import { deidentifyOrders, orderAgain } from "@/modules/ordering";

export async function signOutAction() {
  await signOut();
  refresh();
  redirect("/");
}

/** Your details: name, birth month and the marketing opt-in (ACC-03). */
export async function updateProfileAction(form: FormData) {
  const member = await requireMember("/account");
  await updateProfile(member.id, {
    name: String(form.get("name") ?? ""),
    marketingOptIn: form.get("marketingOptIn") === "on",
    birthMonth: Number(form.get("birthMonth")) || null,
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

/** Add a Favourite to the Cart at today's price (ORD-11). */
export async function addFavouriteAction(form: FormData) {
  const member = await requireMember("/account");
  const favourite = (await favouritesFor(member.id)).find(
    (saved) => saved.id === form.get("id")
  );
  const result = favourite
    ? await addLine(
        { memberId: member.id },
        {
          menuItemId: favourite.menuItemId,
          optionIds: favourite.optionIds,
          quantity: 1,
          note: "",
        }
      )
    : { ok: false };
  refresh();
  redirect(result.ok ? "/cart" : "/cart?left=1");
}

export async function removeFavouriteAction(form: FormData) {
  const member = await requireMember("/account");
  await removeFavourite(member.id, String(form.get("id") ?? ""));
  refresh();
}

/** Order again: a past Order's Lines go back in the Cart (ORD-11). */
export async function orderAgainAction(form: FormData) {
  const member = await requireMember("/account");
  const result = await orderAgain(String(form.get("orderId") ?? ""), member.id);
  refresh();
  const left = result?.skipped.length ?? 0;
  redirect(left ? `/cart?left=${left}` : "/cart");
}
