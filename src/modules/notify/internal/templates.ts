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
  }[];
};

const FOOTER = [
  "Hoshikopi, Kapitolyo, Pasig. Order here for pickup at the counter. Staying? Walk in and find a seat.",
  "Hoshikopi is a concept cafe. Orders and payments here are for demonstration.",
].join("\n");

const pickupText = (order: OrderForEmail) =>
  order.pickupKind === "asap"
    ? `as soon as possible, around ${formatTime(order.windowStart)} today`
    : `at ${formatTime(order.windowStart)} today`;

/** Order placed (ORD-10), with the receipt and the status link. */
export function orderPlacedEmail(order: OrderForEmail, link: string): Email {
  const lines = order.lines.map(
    (line) =>
      `${line.quantity} x ${line.name}${line.options.length ? ` (${line.options.join(", ")})` : ""}: ${formatReceipt(line.lineCents)}`
  );
  return {
    to: order.customerEmail,
    subject: `Order ${order.code} at Hoshikopi: pickup around ${formatTime(order.windowStart)}`,
    text: [
      `Salamat, ${order.customerName}! We got your order.`,
      "",
      `Order Code: ${order.code}`,
      `Pickup: ${pickupText(order)}`,
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
  const first = order.lines[0]?.name ?? "order";
  return {
    to: order.customerEmail,
    subject: `${order.code} is ready for pickup`,
    text: [
      `Your ${first} is ready at the counter. Show code ${order.code}.`,
      "",
      "See you in a bit!",
      "",
      FOOTER,
    ].join("\n"),
  };
}
