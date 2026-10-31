export type OnlineMethod = "gcash" | "maya" | "card";

export type CheckoutRequest = {
  paymentId: string;
  orderCode: string;
  amountCents: number;
  method: OnlineMethod;
  /** Where the provider sends the Customer back: the Order page. */
  returnUrl: string;
};

export type Checkout = { checkoutId: string; checkoutUrl: string };

export type ProviderEvent = {
  /** The provider's event id, the dedupe key (ADR 0003). */
  id: string;
  type: "paid" | "failed" | "other";
  checkoutId: string | null;
  paymentId: string | null;
};

/** What business code may ask of a payment provider (ADR 0003). */
export interface PaymentProvider {
  name: "fake" | "paymongo";
  createCheckout(request: CheckoutRequest): Promise<Checkout>;
  expireCheckout(checkoutId: string): Promise<void>;
  refund(
    providerPaymentId: string,
    amountCents: number
  ): Promise<{ refundId: string }>;
  verifyWebhook(rawBody: string, headers: Headers): boolean;
  parseEvent(rawBody: string): ProviderEvent;
}
