// payments module: Payments, provider events, Refunds.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export { fakeProvider } from "./internal/fake";
export {
  demoAllDayOrdering,
  demoMode,
  paymentProvider,
  signFakeEvent,
} from "./internal/provider";
export type { OnlineMethod, ProviderEvent } from "./internal/types";
export {
  closeCheckout,
  paymentByCheckout,
  recordPaymentEvent,
  refundPayment,
  startPayment,
  verifyWebhookEvent,
} from "./internal/payments";
