"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import type { PaymentMethod } from "@/generated/prisma/enums";
import { formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { currentCartOwner } from "@/modules/cart";
import { currentMember } from "@/modules/identity";
import {
  GUEST_PAY_AT_PICKUP_MAX_DRINKS,
  MAX_DRINKS_PER_ORDER,
  placeOrder,
  type PlaceOrderResult,
} from "@/modules/ordering";

const METHODS: PaymentMethod[] = ["gcash", "maya", "card", "pay_at_pickup"];

export type CheckoutState = {
  message?: string;
  errors?: Partial<Record<string, string>>;
};

function messageFor(result: Exclude<PlaceOrderResult, { ok: true }>): string {
  switch (result.reason) {
    case "invalid":
      return "Check the details above.";
    case "closed":
      return "We're not taking orders right now.";
    case "paused":
      return "Ordering is paused for a moment. Try again soon.";
    case "cart_problem":
      return "Something in your Cart changed. Check your Cart.";
    case "price_changed":
      return `Prices changed: your total is now ${formatPrice(result.totalCents)}. Check it and place your order again.`;
    case "too_many_drinks":
      return `Orders hold up to ${MAX_DRINKS_PER_ORDER} drinks. For more, email us a day ahead.`;
    case "pay_at_pickup_limit":
      return `Guests can pay at pickup for up to ${GUEST_PAY_AT_PICKUP_MAX_DRINKS} drinks. Pay online, or sign in to order more.`;
    case "payment_start_failed":
      return "We couldn't open the payment page. Try again, or choose Pay at Pickup.";
    case "window_unavailable":
      return "That Pickup Time has passed. Choose another.";
    case "no_window":
      return "No Pickup Times are left today. Walk in and order at the counter.";
    case "window_full":
      return result.nextWindow
        ? `That Pickup Time just filled up. The next one is ${formatTime(result.nextWindow)}.`
        : "That Pickup Time just filled up, and none are left today.";
  }
}

export async function placeOrderAction(
  _prev: CheckoutState,
  form: FormData
): Promise<CheckoutState> {
  const owner = await currentCartOwner();
  if (!owner) return { message: "Your Cart is empty." };
  const pickup = String(form.get("pickup") ?? "asap");
  const method = String(form.get("paymentMethod")) as PaymentMethod;
  const result = await placeOrder({
    owner,
    memberId: (await currentMember())?.id ?? null,
    seenTotalCents: Number(form.get("seenTotalCents")),
    customerName: String(form.get("customerName") ?? ""),
    customerEmail: String(form.get("customerEmail") ?? ""),
    customerPhone: String(form.get("customerPhone") ?? ""),
    pickup:
      pickup === "asap"
        ? { kind: "asap" }
        : { kind: "scheduled", windowStart: new Date(pickup) },
    paymentMethod: METHODS.includes(method) ? method : "pay_at_pickup",
  });
  if (result.ok) {
    // The header's Cart count lives in the layout, which a redirect keeps.
    refresh();
    redirect(
      result.checkoutUrl ?? `/orders/${result.orderId}?t=${result.accessToken}`
    );
  }
  // Show the new prices, windows or pause beside the message.
  refresh();
  return {
    message: messageFor(result),
    errors: result.reason === "invalid" ? result.errors : undefined,
  };
}
