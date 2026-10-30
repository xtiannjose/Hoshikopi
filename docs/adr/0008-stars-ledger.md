---
status: accepted
date: 2026-10-30
---

# Stars are a ledger; the balance is a sum

A Member earns 1 Star per drink in an Order when it is Picked Up, and redeems 9 Stars for a free drink (PRD LOY-01 to LOY-05). Every change is a row in `star_entries` with a kind (`earn`, `reserve`, `release`, `reverse`, `adjust`), a signed amount and its Order or reason. The balance is the sum of the rows; there is no balance column to drift.

## Rules

- Stars are earned only at Picked Up, so a cancelled or refunded Order never pays out.
- A Redemption reserves 9 Stars when the Order is placed, inside the same transaction, with the Member row locked and the balance checked, so two tabs cannot spend the same Stars. Cancel or Expire releases them.
- A Refund after pickup reverses the Stars that Order earned.
- Manager adjustments need a reason and are audited.

## Considered options

- **A balance column updated in place.** Rejected: no history, and concurrent updates can lose Stars.
- **Points per peso spent.** Rejected for the concept: a stamp card ("one Star per drink, nine for a free one") is simpler to explain and fits the Star brand. The owner confirms in batch 4.1.

## Consequences

- An index on `star_entries(member_id)` keeps the sum fast; a cached balance can be added later if a Member ever has thousands of rows.
