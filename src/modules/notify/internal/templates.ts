import type { PaymentMethod } from "@/generated/prisma/enums";
import { formatDate, formatTime } from "@/lib/clock";
import { formatPrice, formatReceipt, vatPart } from "@/lib/money";

import type { Email } from "./outbox";

/** What the notify module needs to know about an Order. */
export type OrderForEmail = {
  code: string;
  customerName: string;
  customerEmail: string;
  pickupKind: "asap" | "scheduled";
  windowStart: Date;
  paymentMethod: PaymentMethod; // (audit architecture:20)
  totalCents: number;
  /** Stars the Order's Reward cost, snapshot at placement (audit architecture:17). */
  rewardStars: number;
  /** The cafe's area from Cafe Settings, for the footer. */
  area: string;
  lines: {
    name: string;
    options: string[];
    quantity: number;
    lineCents: number;
    /** The Reward Line: free for Stars, priced at its Options. */
    isReward?: boolean;
  }[];
};

/**
 * "Hoshi Latte", or "Hoshi Latte, free with 9 Stars" for the Reward Line.
 * The number is the Order's own rewardStars, not a literal (audit
 * architecture:17).
 */
export const lineName = (
  line: { name: string; isReward?: boolean },
  stars: number
) => (line.isReward ? `${line.name}, free with ${stars} Stars` : line.name);

/** The one drink by name, or "order" when there is more than one thing. */
export const orderNoun = (lines: { name: string; quantity: number }[]) =>
  lines.length === 1 && lines[0].quantity === 1 ? lines[0].name : "order";

// The area comes from Cafe Settings, not a literal (audit architecture:17).
const footer = (area: string) =>
  [
    `Hoshikopi, ${area}. Order here for pickup at the counter. Staying? Walk in and find a seat.`,
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
      `${line.quantity} x ${lineName(line, order.rewardStars)}${line.options.length ? ` (${line.options.join(", ")})` : ""}: ${formatReceipt(line.lineCents)}`
  );
  return {
    to: order.customerEmail,
    subject: `Order ${order.code} at Hoshikopi: ${pickupWhen(order)}`,
    text: [
      `Salamat, ${order.customerName}! We got your order.`,
      "",
      `Order Code: ${order.code}`,
      `Pickup: ${order.pickupKind === "asap" ? "ready by" : "at"} ${formatTime(order.windowStart)} today`,
      // A PHP 0 Order is stored as Pay at Pickup (audit journeys:11), but
      // there is nothing to collect (audit DC-30); the Order page agrees.
      order.totalCents === 0
        ? "Nothing to pay: a free drink."
        : order.paymentMethod === "pay_at_pickup"
          ? "Pay at the counter when you collect."
          : "Paid online.",
      "",
      ...lines,
      `Total: ${formatReceipt(order.totalCents)} (VAT included: ${formatReceipt(vatPart(order.totalCents))})`,
      "",
      `Follow your order: ${link}`,
      "You can cancel until the bar accepts it.",
      "",
      footer(order.area),
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
      footer(order.area),
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
      footer(order.area),
    ].join("\n"),
  };
}

// The sign-in, Inquiry and Event Sign-up texts lived inline in index.ts,
// untested, while the Order emails were here (audit architecture:22).

/** The sign-in link (Better Auth's magic link, 5 minutes, once). */
export function signInEmail(email: string, url: string): Email {
  return {
    to: email,
    subject: "Your Hoshikopi sign-in link",
    text: `Tap this link to sign in to Hoshikopi. It works once, for 5 minutes.\n\n${url}\n\nDidn't ask for it? You can ignore this email.`,
  };
}

export type InquiryForEmail = {
  kind: "private_event" | "large_order";
  name: string;
  email: string;
  wantedOn: string | null;
  guests: number | null;
  message: string;
};

/** A new Inquiry for the Manager at the cafe's contact address (INFO-11). */
export function inquiryEmail(to: string, inquiry: InquiryForEmail): Email {
  const kind =
    inquiry.kind === "private_event" ? "a private event" : "a large order";
  return {
    to,
    subject: `New inquiry: ${kind} from ${inquiry.name}`,
    text: [
      `${inquiry.name} asked about ${kind}.`,
      `Reply to: ${inquiry.email}`,
      `Date: ${inquiry.wantedOn ?? "not given"}`,
      `Guests: ${inquiry.guests ?? "not given"}`,
      "",
      inquiry.message,
      "",
      "See every Inquiry in /manage/inquiries.",
    ].join("\n"),
  };
}

export type SignupForEmail = {
  to: string;
  seats: number;
  event: { title: string; startsAt: Date; priceCents: number | null };
  link: string;
  confirmed: boolean;
  /** How long an unconfirmed Sign-up holds its Seats (audit architecture:17). */
  holdMinutes: number;
};

/**
 * A Sign-up's email (EVT-02): the link that confirms a Sign-up, or cancels
 * it later (8.7); a Member's Sign-up is confirmed already, so theirs only
 * cancels. The name the visitor typed stays out, so the email carries no
 * text a stranger chose.
 */
export function eventSignupEmail(signup: SignupForEmail): Email {
  const date = formatDate(signup.event.startsAt);
  const when = `${date} at ${formatTime(signup.event.startsAt)}`;
  const seats = `${signup.seats} ${signup.seats === 1 ? "seat" : "seats"}`;
  const price = signup.event.priceCents
    ? `Pay ${formatPrice(signup.event.priceCents)} a seat at the door.`
    : "It's free. Just come by.";
  const footer = "Hoshikopi is a concept cafe: this Event is an example.";
  return {
    to: signup.to,
    subject: signup.confirmed
      ? `You're in: ${signup.event.title}, ${date}`
      : `Confirm your seats: ${signup.event.title}, ${date}`,
    text: (signup.confirmed
      ? [
          `Salamat! You have ${seats} for ${signup.event.title} on ${when}.`,
          price,
          "",
          `Can't make it? Cancel here so someone else can have your seats: ${signup.link}`,
          "",
          footer,
        ]
      : [
          `Salamat! Open this link within ${signup.holdMinutes} minutes to keep your ${seats} for ${signup.event.title} on ${when}:`,
          signup.link,
          "",
          price,
          "Can't make it later? The same link cancels, so someone else can have your seats.",
          `Didn't sign up? Do nothing, and the seats go back in ${signup.holdMinutes} minutes.`,
          "",
          footer,
        ]
    ).join("\n"),
  };
}
