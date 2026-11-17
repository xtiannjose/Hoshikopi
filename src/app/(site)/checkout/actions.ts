"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { PaymentMethod } from "@/generated/prisma/enums";
import { formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { limits } from "@/lib/limits";
import { clientIp } from "@/lib/rate-limit";
import { currentCartOwner } from "@/modules/cart";
import { currentMember } from "@/modules/identity";
import { STARS_PER_REWARD } from "@/modules/loyalty";
import {
  GUEST_PAY_AT_PICKUP_MAX_DRINKS,
  placeOrder,
  type PlaceOrderResult,
} from "@/modules/ordering";

const METHODS: PaymentMethod[] = ["gcash", "maya", "card", "pay_at_pickup"];

export type CheckoutState = {
  message?: string;
  errors?: Partial<Record<string, string>>;
  /** What was typed, kept after a refusal (React resets the form). */
  values?: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    pickup: string;
    paymentMethod: string;
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
    case "cart_changed":
      return `Your Cart changed in another tab: it's now ${formatPrice(result.totalCents)}. Check it and place your order again.`;
    case "too_big":
      return `One order fits one Pickup Window: up to ${result.limit.drinks} drinks and ${result.limit.food} different food items. For more, send us an inquiry from the Visit page a day ahead.`;
    case "pay_at_pickup_limit":
      return `Guests can pay at pickup for up to ${GUEST_PAY_AT_PICKUP_MAX_DRINKS} drinks. Pay online, or sign in to order more.`;
    case "not_enough_stars":
      return `You need ${STARS_PER_REWARD} Stars for a free drink.`;
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
  // "Later today" sends its time in a list beside the chips (8.3).
  const chosen = String(form.get("pickup") ?? "asap");
  const pickup =
    chosen === "later" ? String(form.get("pickupLater") ?? "asap") : chosen;
  const method = String(form.get("paymentMethod")) as PaymentMethod;
  // The Pickup Time and Payment Method come back too, so a refusal keeps them.
  const kept = { ...values, pickup, paymentMethod: method };
  // Every try counts, so nobody can hold Pickup Windows with a flood of Orders.
  const cartKey = "memberId" in owner ? owner.memberId : owner.guestTokenHash;
  const ip = clientIp(await headers());
  if (!(await limits.checkout(cartKey, ip))) {
    return {
      message: "Too many tries. Wait 15 minutes, then place your order.",
      values: kept,
    };
  }
  const memberId = (await currentMember())?.id ?? null;
  const paymentMethod = METHODS.includes(method) ? method : "pay_at_pickup";
  // An unpaid Order costs nothing to leave uncollected, so a Guest's
  // connection and a Member's account may place only so many a day; the
  // morning cron cancels any nobody took (audit ORD-14, SEC2-03, DC-08).
  if (
    paymentMethod === "pay_at_pickup" &&
    !(await limits.payAtPickup(memberId, ip))
  ) {
    return {
      message: memberId
        ? "That's all the Pay at Pickup orders we take from one account today. Pay online to order more."
        : "That's all the Pay at Pickup orders we take from one guest today. Pay online, or sign in to order more.",
      values: kept,
    };
  }
  const result = await placeOrder({
    owner,
    memberId,
    seenTotalCents: Number(form.get("seenTotalCents")),
    ...values,
    pickup:
      pickup === "asap"
        ? { kind: "asap" }
        : { kind: "scheduled", windowStart: new Date(pickup) },
    paymentMethod,
    useReward: form.get("useReward") === "on",
    seenCart: String(form.get("seenCart") ?? ""),
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
    values: kept,
  };
}
