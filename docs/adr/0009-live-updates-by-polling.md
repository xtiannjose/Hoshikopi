---
status: accepted
date: 2026-10-30
---

# Live updates by polling first

The Bar Screen asks for changes every 3 seconds, sending the last Order version it saw; the server answers "no change" in a few bytes. The Customer's Order status page asks every 5 seconds until Ready, then every 30 seconds.

## Why

- It meets the goal (a new Order on the Bar Screen within 5 seconds) on serverless hosting with no extra service.
- One tablet and a few open status pages make a handful of small requests per second at most.

## Considered options

- **Server-Sent Events.** Better latency, but long-lived connections on serverless functions have time limits and cost; revisit if polling is measured as too slow or too costly.
- **A hosted realtime service** (Pusher, Ably, Supabase Realtime). Rejected for now: another account and vendor.
- **WebSockets on a separate server.** Rejected: a second deployable ([ADR 0001](0001-modular-monolith-nextjs.md)).

## Consequences

- Poll responses carry a version number and stay under 5 kB when nothing changed (budget in `docs/05-DESIGN-SYSTEM.md` section 11).
- Polling pauses when the tab is hidden and resumes on focus.
