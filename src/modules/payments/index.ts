// payments module: Payments, provider events, Refunds.
// Other modules import only this file (docs/03-ARCHITECTURE.md section 3).
export { fakeProvider, type FakeProvider } from "./internal/fake";
export { paymentProvider, providerFor } from "./internal/provider";
export type {
  Checkout,
  CheckoutRequest,
  OnlineMethod,
  PaymentProvider,
  ProviderEvent,
} from "./internal/types";
