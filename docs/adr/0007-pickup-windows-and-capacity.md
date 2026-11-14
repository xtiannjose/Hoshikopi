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

## Update 2026-11-14: what Prep Time counts

The November audit found As Soon As Possible promising the 5-minute minimum while Orders waited on the bar, and a 9-drink Order getting the same promise as one drink (audit journeys:2, DOC-04): the code counted only Accepted and Preparing Orders and never the Order's own drinks, though the Glossary defines Prep Time from "the current queue and the Lines in the Order". Prep Time is now `base_minutes + per_drink_minutes × (drinks ahead + this Order's drinks − 1) + Busy Mode minutes`, rounded up to 5 minutes. **Drinks ahead** are the drinks the bar is making (Accepted, Preparing) and the As Soon As Possible Orders waiting on the Bar Screen (Paid, or Placed Pay at Pickup); a Scheduled Order still waiting is made near its own time, so it does not count. The base covers one drink, so a single drink on an empty bar still takes 5 minutes. The Bar Screen's make-next uses the queue without any new Order's drinks. Checkout shows one time for As Soon As Possible, "Ready by" the start of the Pickup Window it books (audit journeys:10).
