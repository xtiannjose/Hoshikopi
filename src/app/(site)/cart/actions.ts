"use server";

import { refresh } from "next/cache";

import { currentCartOwner, removeLine, updateQuantity } from "@/modules/cart";

/** Change a Line's quantity (0 removes it) in this browser's Cart (ORD-02). */
export async function setQuantityAction(form: FormData) {
  const owner = await currentCartOwner();
  if (!owner) return;
  await updateQuantity(
    owner,
    String(form.get("lineId") ?? ""),
    Number(form.get("quantity"))
  );
  refresh();
}

export async function removeLineAction(form: FormData) {
  const owner = await currentCartOwner();
  if (!owner) return;
  await removeLine(owner, String(form.get("lineId") ?? ""));
  refresh();
}
