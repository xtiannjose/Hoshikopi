"use server";

import { refresh } from "next/cache";

import { currentCartOwner, removeLine, stepQuantity } from "@/modules/cart";

/** One more or one less of a Line in this browser's Cart (ORD-02, DC-32). */
export async function stepQuantityAction(form: FormData) {
  const owner = await currentCartOwner();
  if (!owner) return;
  await stepQuantity(
    owner,
    String(form.get("lineId") ?? ""),
    form.get("step") === "-1" ? -1 : 1
  );
  refresh();
}

export async function removeLineAction(form: FormData) {
  const owner = await currentCartOwner();
  if (!owner) return;
  await removeLine(owner, String(form.get("lineId") ?? ""));
  refresh();
}
