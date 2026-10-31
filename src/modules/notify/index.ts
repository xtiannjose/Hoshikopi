// notify module: email templates and sending.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
import { send } from "./internal/outbox";
import {
  orderPlacedEmail,
  orderReadyEmail,
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
