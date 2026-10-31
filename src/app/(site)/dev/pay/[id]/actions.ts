"use server";

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";

import { orderLink } from "@/modules/ordering";
import { paymentByCheckout, signFakeEvent } from "@/modules/payments";

/**
 * The fake checkout's Pay and Fail buttons send a signed webhook to our own
 * webhook route, as a real provider would (PAY-06), then go back to the
 * Order page, which reads the Order rather than this redirect (PAY-03).
 */
export async function fakePayAction(form: FormData) {
  const checkoutId = String(form.get("checkoutId") ?? "");
  const type = form.get("outcome") === "fail" ? "failed" : "paid";
  const payment = await paymentByCheckout(checkoutId);
  if (!payment) redirect("/");
  const signed = signFakeEvent({
    id: `fake_evt_${randomUUID()}`,
    type,
    checkoutId,
    paymentId: `fake_pay_${randomUUID()}`,
  });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await fetch(`${site}/api/webhooks/fake`, {
    method: "POST",
    headers: signed.headers,
    body: signed.body,
  });
  redirect(orderLink(payment.orderId));
}
