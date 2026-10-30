---
status: accepted
date: 2026-10-30
---

# Pickup in 15-minute windows with Capacity and an honest Prep Time

Customers choose As Soon As Possible or a Scheduled Pickup. Both land in a 15-minute Pickup Window that holds a limited number of drinks and food Lines (Capacity, set per day of the week). Prep Time for ASAP is `base_minutes + per_drink_minutes × drinks queued ahead`, rounded up to 5 minutes, and ASAP takes the earliest window with room after that.

## Why

The promise "ready in 8 minutes" is the product (PRD section 6). Without Capacity, a rush of Orders makes every estimate wrong and the Customer waits at the counter anyway.

## Rules

- `placeOrder` locks the window's usage row and checks Capacity inside its transaction; a full window is refused with the next free one.
- Cancelled, Expired and Refunded Orders give their counts back in the same transaction as their transition.
- Unpaid online Orders older than 15 minutes are expired on read (whenever windows, the Bar Screen or an Order load) and by the daily cron, because Vercel Hobby runs cron once a day.

## Considered options

- **No Capacity, a fixed "ready in 10 minutes".** Rejected: breaks at the first rush.
- **A queue model per Barista.** Rejected for the MVP: needs staffing data the concept does not have. Revisit with real data.

## Consequences

- Capacity and Prep Time defaults are Manager settings, seeded with 12 drinks and 8 food Lines per window, 4 minutes base and 1.5 minutes per drink; batch 2.1 confirms them.
