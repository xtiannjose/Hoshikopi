import { hmacHex, sameSignature } from "./sign";
import type { PaymentProvider, ProviderEvent } from "./types";

const API = "https://api.paymongo.com/v1";

const METHOD = { gcash: "gcash", maya: "paymaya", card: "card" } as const;

/**
 * PayMongo hosted checkout in Test Mode only (ADR 0003): plain fetch to the
 * REST API; providerFor() refuses anything but an sk_test_ key.
 * shortcut: request and event shapes follow the public docs but were not run
 * against a sandbox (no account yet); check them when batch 3.4 runs.
 */
export function payMongoProvider(
  secretKey: string,
  webhookSecret: string
): PaymentProvider {
  const auth = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
  async function call(path: string, body?: unknown) {
    const response = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`PayMongo ${path} answered ${response.status}`);
    }
    return (await response.json()) as {
      data: { id: string; attributes: Record<string, unknown> };
    };
  }
  return {
    name: "paymongo",
    async createCheckout(request) {
      const { data } = await call("/checkout_sessions", {
        data: {
          attributes: {
            line_items: [
              {
                name: `Hoshikopi order ${request.orderCode}`,
                amount: request.amountCents,
                currency: "PHP",
                quantity: 1,
              },
            ],
            payment_method_types: [METHOD[request.method]],
            reference_number: request.paymentId,
            success_url: request.returnUrl,
            cancel_url: request.returnUrl,
            send_email_receipt: false,
            show_line_items: true,
          },
        },
      });
      return {
        checkoutId: data.id,
        checkoutUrl: String(data.attributes.checkout_url),
      };
    },
    async expireCheckout(checkoutId) {
      await call(`/checkout_sessions/${checkoutId}/expire`);
    },
    async refund(providerPaymentId, amountCents) {
      const { data } = await call("/refunds", {
        data: {
          attributes: {
            amount: amountCents,
            payment_id: providerPaymentId,
            reason: "requested_by_customer",
          },
        },
      });
      return { refundId: data.id };
    },
    verifyWebhook(rawBody, headers) {
      // Header: t=<timestamp>,te=<test-mode signature>,li=<live signature>
      const parts = Object.fromEntries(
        (headers.get("paymongo-signature") ?? "")
          .split(",")
          .map((part) => part.split("=") as [string, string])
      );
      if (!parts.t || !parts.te) return false;
      return sameSignature(
        parts.te,
        hmacHex(webhookSecret, `${parts.t}.${rawBody}`)
      );
    },
    parseEvent(rawBody): ProviderEvent {
      const event = JSON.parse(rawBody) as {
        data: {
          id: string;
          attributes: {
            type: string;
            data?: {
              id?: string;
              attributes?: { payments?: { id: string }[] };
            };
          };
        };
      };
      const type = event.data.attributes.type;
      const resource = event.data.attributes.data;
      return {
        id: event.data.id,
        type:
          type === "checkout_session.payment.paid"
            ? "paid"
            : type === "payment.failed"
              ? "failed"
              : "other",
        checkoutId: resource?.id ?? null,
        paymentId: resource?.attributes?.payments?.[0]?.id ?? null,
      };
    },
  };
}
