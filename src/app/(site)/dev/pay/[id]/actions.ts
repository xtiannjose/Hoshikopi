"use server";

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";

import { orderLink } from "@/modules/ordering";
import { paymentByCheckout, signFakeEvent } from "@/modules/payments";
import { siteUrl } from "@/lib/env";

/**
 * The fake checkout's Pay and Fail buttons send a signed webhook to our own
 * webhook route, as a real provider would (PAY-06), then go back to the
 * Order page, which reads the Order rather than this redirect (PAY-03). A
 * webhook that refuses or can't be reached changed nothing, so the Customer
 * goes back to the checkout to try again (audit SEC1-17).
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
  const site = siteUrl();
  // redirect() throws, so it stays outside the promise's handlers.
  const problem = await fetch(`${site}/api/webhooks/fake`, {
    method: "POST",
    headers: signed.headers,
    body: signed.body,
  }).then(
    (response) => (response.ok ? null : response.status),
    (error: unknown) => error
  );
  if (problem !== null) {
    console.error("[payments] the fake webhook did not go through:", problem);
    redirect(`/dev/pay/${checkoutId}?retry=1`);
  }
  redirect(orderLink(payment.orderId));
}
