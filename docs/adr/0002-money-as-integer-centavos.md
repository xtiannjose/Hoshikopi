---
status: accepted
date: 2026-10-30
---

# Money is stored and computed as integer centavos

All amounts are integers in centavos (PHP 165.00 is `16500`) in the database, server code and payment requests. Floating-point numbers cannot hold most decimal prices exactly, and the errors would show as one-centavo mismatches between the Cart, the Order and the payment provider.

## Rules

- Columns end in `_cents` and are integers; Price Deltas are never negative.
- Prices include VAT. The VAT part shown on a receipt is computed once per Order with one rounding rule (round half up) in `lib/money.ts`; totals are never rebuilt from rounded display values.
- Only `lib/money.ts` formats money for people: `PHP 165` on the menu (no centavos when they are zero), `PHP 165.00` on receipts.
- Client-sent prices and totals are ignored; the server prices every Line ([ADR 0001](0001-modular-monolith-nextjs.md), `docs/03-ARCHITECTURE.md` section 5).

## Consequences

- Every money helper has unit tests, including rounding at .5 centavos.
- PayMongo amounts are already in centavos, so no conversion happens at the provider edge.
