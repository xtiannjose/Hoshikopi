// notify module: email templates and sending.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
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
