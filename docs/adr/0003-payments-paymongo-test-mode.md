---
status: accepted
date: 2026-10-30
---

# Payments go through a provider interface; PayMongo in Test Mode, plus a fake provider

Business code talks only to a `PaymentProvider` interface: `createCheckout`, `expireCheckout`, `refund`, `verifyWebhook`, `parseEvent`. Two adapters implement it:

- **`fake`**: a local hosted checkout at `/dev/pay/[id]` whose Pay and Fail buttons send signed webhooks. It runs every flow, test and demo with no outside account. It refuses to run on a production domain.
- **`paymongo`**: PayMongo's hosted checkout for GCash, Maya and Card, the same provider Hoshimono chose (GCash and cards in the Philippines, HMAC-signed webhooks, refunds). **Test keys only**: the adapter refuses to start with a key that does not begin with `sk_test_`, on every environment, because Hoshikopi is a concept that must never take real money ([ADR 0006](0006-concept-project-no-real-money.md)).

Pay at Pickup needs no provider: the Barista marks the Order paid at the counter.

## Considered options

- **Xendit.** Also covers GCash and cards; rejected to stay consistent with Hoshimono and its signed webhooks.
- **Only the `fake` provider.** Kept as the default; PayMongo test mode is added in batch 3.4 if the owner creates a PayMongo account (decision due in batch 3.1).

## Consequences

- Payment state comes only from verified webhooks, recorded once under a unique (`provider`, `provider_event_id`); a repeated event is acknowledged and ignored. The browser's return page never decides payment state.
- Unpaid online Orders Expire after 15 minutes; the checkout session is expired through the interface as well.
- Refunds are full only in the MVP.
