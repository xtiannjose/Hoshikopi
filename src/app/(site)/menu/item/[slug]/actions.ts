"use server";

import { refresh } from "next/cache";

import { addLine, cartOwnerForWrite, MAX_LINE_QUANTITY } from "@/modules/cart";

export type AddState =
  | { status: "idle" }
  | { status: "added"; at: number }
  | { status: "error"; message: string };

const MESSAGES = {
  unavailable: "This one is off the menu now.",
  sold_out: "Sorry, this is sold out today.",
  option_sold_out: "One of your choices is sold out today. Pick another.",
  invalid_options: "Choose one of each required option.",
  too_many: `That's more than ${MAX_LINE_QUANTITY} of one item. Email us for big orders.`,
};

/** Add to the Cart; the server checks and prices it (ORD-01, ORD-06). */
export async function addToCartAction(
  _prev: AddState,
  form: FormData
): Promise<AddState> {
  const optionIds = [...form.entries()]
    .filter(([key, value]) => key.startsWith("option-") && value !== "")
    .map(([, value]) => String(value));
  const quantity = Number(form.get("quantity"));
  const result = await addLine(await cartOwnerForWrite(), {
    menuItemId: String(form.get("menuItemId") ?? ""),
    optionIds,
    quantity: Number.isInteger(quantity) ? quantity : 1,
    note: String(form.get("note") ?? ""),
  });
  if (!result.ok) return { status: "error", message: MESSAGES[result.reason] };
  // The header's Cart count reads the Cart; show the new one.
  refresh();
  return { status: "added", at: Date.now() };
}
