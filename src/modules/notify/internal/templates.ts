import { formatTime } from "@/lib/clock";
import { formatReceipt, vatPart } from "@/lib/money";

import type { Email } from "./outbox";

/** What the notify module needs to know about an Order. */
export type OrderForEmail = {
  code: string;
  customerName: string;
  customerEmail: string;
  pickupKind: "asap" | "scheduled";
  windowStart: Date;
  paymentMethod: string;
  totalCents: number;
  lines: {
    name: string;
    options: string[];
    quantity: number;
    lineCents: number;
    /** The Reward Line: free with 9 Stars, priced at its Options. */
    isReward?: boolean;
  }[];
};

/** "Hoshi Latte", or "Hoshi Latte, free with 9 Stars" for the Reward Line. */
export const lineName = (line: { name: string; isReward?: boolean }) =>
  line.isReward ? `${line.name}, free with 9 Stars` : line.name;

/** The one drink by name, or "order" when there is more than one thing. */
export const orderNoun = (lines: { name: string; quantity: number }[]) =>
  lines.length === 1 && lines[0].quantity === 1 ? lines[0].name : "order";

const FOOTER = [
  "Hoshikopi, Kapitolyo, Pasig. Order here for pickup at the counter. Staying? Walk in and find a seat.",
  "Hoshikopi is a concept cafe. Orders and payments here are for demonstration.",
].join("\n");

// One time everywhere: the start of the window the Order is booked in
// (audit journeys:10).
const pickupWhen = (order: OrderForEmail) =>
  `${order.pickupKind === "asap" ? "ready by" : "pickup at"} ${formatTime(order.windowStart)}`;

/** Order placed (ORD-10), with the receipt and the status link. */
export function orderPlacedEmail(order: OrderForEmail, link: string): Email {
  const lines = order.lines.map(
    (line) =>
      `${line.quantity} x ${lineName(line)}${line.options.length ? ` (${line.options.join(", ")})` : ""}: ${formatReceipt(line.lineCents)}`
  );
  return {
    to: order.customerEmail,
    subject: `Order ${order.code} at Hoshikopi: ${pickupWhen(order)}`,
    text: [
      `Salamat, ${order.customerName}! We got your order.`,
      "",
      `Order Code: ${order.code}`,
      `Pickup: ${order.pickupKind === "asap" ? "ready by" : "at"} ${formatTime(order.windowStart)} today`,
      order.paymentMethod === "pay_at_pickup"
        ? "Pay at the counter when you collect."
        : "Paid online.",
      "",
      ...lines,
      `Total: ${formatReceipt(order.totalCents)} (VAT included: ${formatReceipt(vatPart(order.totalCents))})`,
      "",
      `Follow your order: ${link}`,
      "You can cancel until the bar accepts it.",
      "",
      FOOTER,
    ].join("\n"),
  };
}

/** Ready for pickup (ORD-10). */
export function orderReadyEmail(order: OrderForEmail): Email {
  return {
    to: order.customerEmail,
    subject: `${order.code} is ready for pickup`,
    text: [
      `Your ${orderNoun(order.lines)} is ready at the counter. Show code ${order.code}.`,
      "",
      "See you in a bit!",
      "",
      FOOTER,
    ].join("\n"),
  };
}

/** Refunded in full (PAY-05). */
export function orderRefundedEmail(order: OrderForEmail): Email {
  return {
    to: order.customerEmail,
    subject: `Order ${order.code} was refunded`,
    text: [
      `Your order ${order.code} was refunded in full: ${formatReceipt(order.totalCents)}.`,
      order.paymentMethod === "pay_at_pickup"
        ? "We refund it at the counter."
        : "It goes back the way you paid (Test Mode: no real money moved).",
      "",
      "Sorry it didn't work out this time. Salamat for your patience.",
      "",
      FOOTER,
    ].join("\n"),
  };
}
