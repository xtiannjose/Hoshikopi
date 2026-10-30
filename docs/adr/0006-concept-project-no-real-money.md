---
status: accepted
date: 2026-10-30
---

# Hoshikopi is a concept: invented details are labelled and no real money moves

Hoshikopi is a portfolio project, not a real business (owner, 2026-10-30). Everything is built as if the cafe were real, with two hard limits:

1. **Invented details are labelled.** The cafe's name is real for the project, but its address, map pin, phone, people, menu prices and photos are invented or stand-ins. A Concept Notice in every page footer and at checkout says so: "Hoshikopi is a concept cafe. Orders and payments here are for demonstration."
2. **No real money.** Online payments run only through the `fake` provider or PayMongo test keys; the payment layer refuses live keys on every environment ([ADR 0003](0003-payments-paymongo-test-mode.md)). Pay at Pickup creates Orders that no counter will ever see outside a demo.

## Consequences

- Structured data and the cafe page carry the invented address, so search engines are kept away from the demo (noindex) until the owner decides otherwise.
- Real-launch work (business registration, BIR receipts, the Internet Transactions Act duties for online merchants, live payment keys, real photos, staff accounts) is listed in the PRD and roadmap but not built.
- Changing either limit needs a new ADR.
