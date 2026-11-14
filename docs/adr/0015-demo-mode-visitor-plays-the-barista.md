---
status: accepted
date: 2026-11-08
---

# Demo Mode: a visitor plays the barista on their own Order

A reviewer who opens the live demo alone can browse and place an Order, but every step after Placed needs a Staff session (ADR 0005), so their Order stays Placed and the project's best part, an Order moving live from the bar to the status page, stays invisible (audit FEAT-01, PRD section 8, success metric 4).

While **Demo Mode** is on, the Order page shows a "Be the barista" panel. Its one button is the bar's next step for that Order (Accept the order, Start making it, Mark it Ready, Hand it over), the same steps as the Bar Screen. `advanceInDemo(id, token)` in the `ordering` module checks the Order's link token, picks the next Order Status and calls `transition()` with a new actor, `{ kind: "demo" }`. The Order Status table allows that actor the four bar steps (`accepted`, `preparing`, `ready`, `picked_up`) only while Demo Mode is on; `order_events` records it as `actor_kind = demo`, so no visitor's tap ever looks like a Staff member's. Side effects stay the same: the Ready email, Pay at Pickup marked paid at the counter, Stars earned.

**Demo Mode is on exactly when the fake payment provider runs** (`demoMode()` in the `payments` module), which it does only locally and on `*.vercel.app` (ADR 0003). One switch says "this is a demo": a deployment with real payments has no Demo Mode, and no extra setting can leave it on by mistake.

The concept page gets a "Try it in two minutes" guide while Demo Mode is on.

## Update 2026-11-14: the hosted demo takes Orders all day

The November audit found the two-minute demo closed from 8:30 PM to 7:00 AM Manila time, which is most of a reviewer's day in the US and Europe (audit journeys:1, a P0). So **a production build where Demo Mode runs takes Orders all day**: `demoAllDayOrdering()` in the `payments` module, true on the live demo on `*.vercel.app`, its previews and the local e2e build, false in local development and in tests, which keep the cafe's real hours. The `ordering` module reads the day through `orderingDay()`, which then swaps in 00:00 to 23:45 (closing 23:59) for checkout, placement, the Cart and the Bar Screen. Pause, Busy Mode, Capacity and Prep Time still apply, and the Visit page, the hero and Opening Hours still show the real hours; checkout says the demo takes orders any time and points to them. Ordering ahead for tomorrow (ORD-03's V1 part, audit ORD-09) stays out of scope.

## Considered options

- **A demo Staff sign-in ("Try the Bar Screen").** Rejected: it means minting sessions without an email, and every visitor could move every other visitor's Orders.
- **A Bar Screen filtered to the visitor's Order.** Rejected for now: a second, read-only copy of the Bar Screen to keep in step with the real one, for the same taps the panel gives.
- **Recording the taps as `system` or as a Staff actor.** Rejected: the audit trail would hide who moved the Order.

## Consequences

- The Bar Screen itself stays Staff-only; the case study shows it with screenshots.
- A visitor can move only an Order whose link they hold, one step at a time, in the order the table allows; an unpaid online Order still waits for its checkout.
- A new `ActorKind` value (`demo`, migration `demo_actor`).
