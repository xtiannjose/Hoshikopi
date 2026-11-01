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

export type { OrderForEmail } from "./internal/templates";

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

/** A Sign-up's confirmation (EVT-02). */
export async function sendEventSignup(signup: {
  to: string;
  name: string;
  seats: number;
  event: { title: string; startsAt: Date; priceCents: number | null };
  link: string;
}) {
  const when = `${formatDate(signup.event.startsAt)} at ${formatTime(signup.event.startsAt)}`;
  const seats = `${signup.seats} ${signup.seats === 1 ? "seat" : "seats"}`;
  await send({
    to: signup.to,
    subject: `You're in: ${signup.event.title}, ${formatDate(signup.event.startsAt)}`,
    text: [
      `Salamat, ${signup.name}! You signed up for ${signup.event.title} on ${when}, ${seats}.`,
      signup.event.priceCents
        ? `Pay ${formatPrice(signup.event.priceCents)} a seat at the door.`
        : "It's free. Just come by.",
      "",
      `About the Event: ${signup.link}`,
      "Can't make it? Reply to this email so someone else can have your seat.",
      "",
      "Hoshikopi is a concept cafe: this Event is an example.",
    ].join("\n"),
  });
}
