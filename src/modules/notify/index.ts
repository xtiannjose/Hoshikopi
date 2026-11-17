// notify module: email templates and sending.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
import { send } from "./internal/outbox";
import {
  eventSignupEmail,
  inquiryEmail,
  orderPlacedEmail,
  orderReadyEmail,
  orderRefundedEmail,
  signInEmail,
  type InquiryForEmail,
  type OrderForEmail,
  type SignupForEmail,
} from "./internal/templates";

export { lineName, orderNoun, type OrderForEmail } from "./internal/templates";
export { canEmail, isDemoAccount } from "./internal/outbox";

export async function sendSignInLink(email: string, url: string) {
  await send(signInEmail(email, url));
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
export async function sendInquiry(to: string, inquiry: InquiryForEmail) {
  await send(inquiryEmail(to, inquiry));
}

/** A Sign-up's confirm or cancel link (EVT-02, 8.7). */
export async function sendEventSignup(signup: SignupForEmail) {
  await send(eventSignupEmail(signup));
}
