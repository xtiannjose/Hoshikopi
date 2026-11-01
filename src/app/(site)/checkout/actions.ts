"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { PaymentMethod } from "@/generated/prisma/enums";
import { formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { clientIp, takeToken } from "@/lib/rate-limit";
import { currentCartOwner } from "@/modules/cart";
import { currentMember } from "@/modules/identity";
import {
  GUEST_PAY_AT_PICKUP_MAX_DRINKS,
  MAX_DRINKS_PER_ORDER,
  placeOrder,
  type PlaceOrderResult,
} from "@/modules/ordering";

const METHODS: PaymentMethod[] = ["gcash", "maya", "card", "pay_at_pickup"];
const FIFTEEN_MINUTES = 15 * 60;

export type CheckoutState = {
  message?: string;
  errors?: Partial<Record<string, string>>;
  /** What was typed, kept after a refusal (React resets the form). */
  values?: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
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
      return `Orders hold up to ${MAX_DRINKS_PER_ORDER} drinks. For more, send us an inquiry from the Visit page a day ahead.`;
    case "pay_at_pickup_limit":
      return `Guests can pay at pickup for up to ${GUEST_PAY_AT_PICKUP_MAX_DRINKS} drinks. Pay online, or sign in to order more.`;
    case "not_enough_stars":
      return "You need 9 Stars for a free drink.";
    case "reward_unavailable":
      return "A Reward needs a drink in your Cart and a signed-in Member.";
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
  const values = {
    customerName: String(form.get("customerName") ?? ""),
    customerEmail: String(form.get("customerEmail") ?? ""),
    customerPhone: String(form.get("customerPhone") ?? ""),
  };
  // Every try counts, so nobody can hold Pickup Windows with a flood of Orders.
  const cartKey = "memberId" in owner ? owner.memberId : owner.guestTokenHash;
  const allowed =
    (await takeToken(`checkout:${cartKey}`, 10, FIFTEEN_MINUTES)) &&
    (await takeToken(
      `checkout-ip:${clientIp(await headers())}`,
      20,
      FIFTEEN_MINUTES
    ));
  if (!allowed) {
    return {
      message: "Too many tries. Wait 15 minutes, then place your order.",
      values,
    };
  }
  const pickup = String(form.get("pickup") ?? "asap");
  const method = String(form.get("paymentMethod")) as PaymentMethod;
  const result = await placeOrder({
    owner,
    memberId: (await currentMember())?.id ?? null,
    seenTotalCents: Number(form.get("seenTotalCents")),
    ...values,
    pickup:
      pickup === "asap"
        ? { kind: "asap" }
        : { kind: "scheduled", windowStart: new Date(pickup) },
    paymentMethod: METHODS.includes(method) ? method : "pay_at_pickup",
    useReward: form.get("useReward") === "on",
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
    values,
  };
}
