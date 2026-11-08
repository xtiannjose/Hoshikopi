"use server";

import { refresh } from "next/cache";

import { advanceInDemo, cancelByCustomer } from "@/modules/ordering";

/** The Customer cancels from the status page (ORD-09). */
export async function cancelOrderAction(form: FormData) {
  await cancelByCustomer(
    String(form.get("id") ?? ""),
    String(form.get("t") ?? "")
  );
  refresh();
}

/** Demo Mode (ADR 0015): the visitor taps the bar's next step. */
export async function demoAdvanceAction(form: FormData) {
  await advanceInDemo(
    String(form.get("id") ?? ""),
    String(form.get("t") ?? "")
  );
  refresh();
}
