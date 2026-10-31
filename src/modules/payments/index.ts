// payments module: Payments, provider events, Refunds.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export { fakeProvider, type FakeProvider } from "./internal/fake";
export {
  paymentProvider,
  providerFor,
  signFakeEvent,
} from "./internal/provider";
export type {
  Checkout,
  CheckoutRequest,
  OnlineMethod,
  PaymentProvider,
  ProviderEvent,
} from "./internal/types";
export {
  closeCheckout,
  paymentByCheckout,
  paymentForOrder,
  recordPaymentEvent,
  refundPayment,
  type RefundOutcome,
  startPayment,
  verifyWebhookEvent,
  type RecordedEvent,
  type VerifiedEvent,
} from "./internal/payments";
