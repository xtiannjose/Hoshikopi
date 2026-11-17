"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import {
  addLine,
  cartOwnerForWrite,
  changeLine,
  currentCartOwner,
  MAX_FAVOURITES,
  MAX_LINE_QUANTITY,
  saveFavourite,
} from "@/modules/cart";
import { currentMember } from "@/modules/identity";

export type AddState =
  | { status: "idle" }
  // count goes up with each add in a row, so "Added" plays again.
  | { status: "added"; count: number }
  | { status: "error"; message: string };

const MESSAGES = {
  unavailable: "This one is off the menu now.",
  sold_out: "Sorry, this is sold out today.",
  option_sold_out: "One of your choices is sold out today. Pick another.",
  invalid_options: "Choose one of each required option.",
  too_many: `That's more than ${MAX_LINE_QUANTITY} of one item. Send us an inquiry for big orders.`,
};

const optionIdsOf = (form: FormData) =>
  [...form.entries()]
    .filter(([key, value]) => key.startsWith("option-") && value !== "")
    .map(([, value]) => String(value));

/** Add to the Cart; the server checks and prices it (ORD-01, ORD-06). */
export async function addToCartAction(
  prev: AddState,
  form: FormData
): Promise<AddState> {
  const quantity = Number(form.get("quantity"));
  const result = await addLine(await cartOwnerForWrite(), {
    menuItemId: String(form.get("menuItemId") ?? ""),
    optionIds: optionIdsOf(form),
    quantity: Number.isInteger(quantity) ? quantity : 1,
    note: String(form.get("note") ?? ""),
  });
  if (!result.ok) return { status: "error", message: MESSAGES[result.reason] };
  // The header's Cart count reads the Cart; show the new one.
  refresh();
  return {
    status: "added",
    count: (prev.status === "added" ? prev.count : 0) + 1,
  };
}

/**
 * Change a Cart Line's Options, quantity and note, then back to the Cart;
 * the server checks and prices them (PRD ORD-02, audit journeys:14).
 */
export async function changeLineAction(
  _prev: AddState,
  form: FormData
): Promise<AddState> {
  const owner = await currentCartOwner();
  const quantity = Number(form.get("quantity"));
  const result = owner
    ? await changeLine(owner, String(form.get("lineId") ?? ""), {
        menuItemId: String(form.get("menuItemId") ?? ""),
        optionIds: optionIdsOf(form),
        quantity: Number.isInteger(quantity) ? quantity : 1,
        note: String(form.get("note") ?? ""),
      })
    : ({ ok: false, reason: "not_found" } as const);
  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "not_found"
          ? "This is no longer in your Cart."
          : MESSAGES[result.reason],
    };
  }
  // The header's Cart count lives in the layout, which a redirect keeps.
  refresh();
  redirect("/cart");
}

export type FavouriteState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "sign_in" }
  | { status: "error"; message: string };

const FAVOURITE_MESSAGES = {
  unavailable: MESSAGES.unavailable,
  invalid_options: MESSAGES.invalid_options,
  too_many: `You have ${MAX_FAVOURITES} Favourites. Remove one in your account first.`,
};

/** A Member saves this choice as a Favourite (ORD-11). */
export async function saveFavouriteAction(
  _prev: FavouriteState,
  form: FormData
): Promise<FavouriteState> {
  const member = await currentMember();
  if (!member) return { status: "sign_in" };
  const result = await saveFavourite(member.id, {
    menuItemId: String(form.get("menuItemId") ?? ""),
    optionIds: optionIdsOf(form),
  });
  return result.ok
    ? { status: "saved" }
    : { status: "error", message: FAVOURITE_MESSAGES[result.reason] };
}
