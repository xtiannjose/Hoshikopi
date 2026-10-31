"use server";

import { refresh } from "next/cache";

import { cancelByCustomer } from "@/modules/ordering";

/** The Customer cancels from the status page (ORD-09). */
export async function cancelOrderAction(form: FormData) {
  await cancelByCustomer(
    String(form.get("id") ?? ""),
    String(form.get("t") ?? "")
  );
  refresh();
}
