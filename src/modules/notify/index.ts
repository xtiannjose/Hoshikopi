// notify module: email templates and sending.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
import { formatDate, formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";

import { send } from "./internal/outbox";
import {
  orderPlacedEmail,
  orderReadyEmail,
  orderRefundedEmail,
  type OrderForEmail,
} from "./internal/templates";

export { lineName, orderNoun, type OrderForEmail } from "./internal/templates";
export { canEmail, isDemoAccount } from "./internal/outbox";

export async function sendSignInLink(email: string, url: string) {
  await send({
    to: email,
    subject: "Your Hoshikopi sign-in link",
    text: `Tap this link to sign in to Hoshikopi. It works once, for 5 minutes.\n\n${url}\n\nDidn't ask for it? You can ignore this email.`,
  });
}

/** "Order placed" with the receipt and the status link (ORD-10). */
export async function sendOrderPlaced(order: OrderForEmail, link: string) {
  await send(orderPlacedEmail(order, link));
}

/** "Ready for pickup" (ORD-10). */
export async function sendOrderReady(order: OrderForEmail) {
  await send(orderReadyEmail(order));
}

/** "Refunded in full" (PAY-05). */
export async function sendOrderRefunded(order: OrderForEmail) {
  await send(orderRefundedEmail(order));
}

/** A new Inquiry for the Manager at the cafe's contact address (INFO-11). */
export async function sendInquiry(
  to: string,
  inquiry: {
    kind: "private_event" | "large_order";
    name: string;
    email: string;
    wantedOn: string | null;
    guests: number | null;
    message: string;
  }
) {
  const kind =
    inquiry.kind === "private_event" ? "a private event" : "a large order";
  await send({
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
  });
}

/**
 * A Sign-up's email (EVT-02): the link that confirms a Sign-up, or cancels it later (8.7); a Member's
 * Sign-up is confirmed already, so theirs only cancels. The name the
 * visitor typed stays out, so the email carries no text a stranger chose.
 */
export async function sendEventSignup(signup: {
  to: string;
  seats: number;
  event: { title: string; startsAt: Date; priceCents: number | null };
  link: string;
  confirmed: boolean;
}) {
  const date = formatDate(signup.event.startsAt);
  const when = `${date} at ${formatTime(signup.event.startsAt)}`;
  const seats = `${signup.seats} ${signup.seats === 1 ? "seat" : "seats"}`;
  const price = signup.event.priceCents
    ? `Pay ${formatPrice(signup.event.priceCents)} a seat at the door.`
    : "It's free. Just come by.";
  const footer = "Hoshikopi is a concept cafe: this Event is an example.";
  await send({
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
          `Salamat! Open this link within 30 minutes to keep your ${seats} for ${signup.event.title} on ${when}:`,
          signup.link,
          "",
          price,
          "Can't make it later? The same link cancels, so someone else can have your seats.",
          "Didn't sign up? Do nothing, and the seats go back in 30 minutes.",
          "",
          footer,
        ]
    ).join("\n"),
  });
}
