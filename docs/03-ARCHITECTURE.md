# Architecture

> **In plain words:** This document explains how the Hoshikopi website is built: its parts, what each part is in charge of, and the rules that keep Orders, money and Stars correct. Two rules matter most. The server works out every price itself. An Order changes status only through one function and the table in section 7.
>
> **Who should read it:** developers before changing how the site works; reviewers checking a pull request; an owner or project manager who wants to know why the site behaves as it does.
> **Last checked:** 2026-11-17.

Scope comes from the [PRD](01-PRD.md), words from the [Glossary](../GLOSSARY.md), tables from the [Data Model](04-DATA-MODEL.md). An ADR (Architecture Decision Record, a short note in [`docs/adr/`](adr/) that records one decision and why) settles some rules here. Changing such a rule needs a new ADR.

## Contents

1. [Principles](#1-principles)
2. [System context](#2-system-context)
3. [Module map](#3-module-map)
4. [Routes and rendering](#4-routes-and-rendering)
5. [Cart and pricing](#5-cart-and-pricing)
6. [Checkout and order placement](#6-checkout-and-order-placement)
7. [Order lifecycle](#7-order-lifecycle)
8. [Payments](#8-payments)
9. [Pickup Windows, Capacity and Prep Time](#9-pickup-windows-capacity-and-prep-time)
10. [Loyalty](#10-loyalty)
11. [Live updates](#11-live-updates)
12. [Jobs and time](#12-jobs-and-time)
13. [Accounts, Staff and security](#13-accounts-staff-and-security)
14. [Content and images](#14-content-and-images)
15. [Testing](#15-testing)

## 1. Principles

These eight rules shape everything else in this document. When a choice is unclear, they decide it.

1. **One Next.js app, organised in modules** ([ADR 0001](adr/0001-modular-monolith-nextjs.md)). Next.js is the web framework the site is built with. Customer pages, Staff pages, webhooks and jobs deploy together as one program. Business logic lives in `src/modules/*`. A module is a folder of code in charge of one part of the business, such as the menu or the Stars, and each has one public front door, its `index.ts`.
2. **Server Components by default.** A Server Component is a part of a page that the server builds and sends as finished HTML, so the phone downloads less code. `"use client"` marks a client component, one that runs in the browser. It is used only for leaf components (small parts at the edge of a page) that hold state or need browser features: the Option picker, the Cart count and the Bar Screen, which is one client component. The Cart drawer is a Server Component with a native `popover`.
3. **The server decides money.** Prices, Price Deltas, Rewards and totals are worked out again on the server at every step. Money is integer centavos everywhere, so PHP 165.00 is `16500` ([ADR 0002](adr/0002-money-as-integer-centavos.md)). Whole numbers never round wrong.
4. **Order Status is a state machine.** A state machine is a fixed list of allowed moves between statuses. Only the moves in section 7 exist, each in one function with its side effects.
5. **Public pages are prerendered.** Prerendered means built ahead of time and served as a ready copy, so it loads fast. Menu, cafe, Events and Posts render at build time and refresh by cache tag when Staff change them (section 4).
6. **Manila time at the edges.** The database stores UTC (world standard time). Opening Hours, Special Hours and Pickup Windows are defined and shown in `Asia/Manila`.
7. **No real money, ever** ([ADR 0006](adr/0006-concept-project-no-real-money.md)). The payment layer refuses live keys.
8. **Boring first.** Polling before sockets, a table before a queue, one cafe before many. Each upgrade waits for a measured need.

## 2. System context

The website is one program hosted on Vercel. It talks to a few outside services: a database, a payment provider, an email sender and a photo store. There are no others.

```
 Customer phone ──┐                         ┌── PayMongo (Test Mode): hosted checkout, webhooks
                  │                         │
 Staff tablet ────┼──> Next.js 16 on Vercel ┼── Neon PostgreSQL (Singapore), through Prisma
 (Bar Screen,     │    (pages, Server        │
  manage pages)   │     Actions, route       ├── Resend: order and sign-in emails
                  │     handlers, cron)      │
 Google sign-in ──┘                         └── Vercel Blob: menu, Event and Post photos
```

| Name | What it is |
| --- | --- |
| Vercel | The company that hosts and runs the site |
| Neon | The company that hosts the PostgreSQL database, in Singapore |
| Prisma | The library the code uses to read and write the database |
| PayMongo | A Philippine payment company; used in Test Mode only |
| Resend | An email sending service |
| Vercel Blob | Vercel's file storage, used for uploaded photos |
| Server Action | A server function that a form or button calls directly |
| Route handler | An address that answers with data or a file instead of a page |
| Cron | A timer that calls the site on a schedule (section 12) |

Search, analytics and error tracking are added only when a phase needs them ([`docs/07-ROADMAP.md`](07-ROADMAP.md)). Today the demo runs the `fake` provider in place of PayMongo (ADR 0003 update) and sends no email through Resend until a domain exists (`docs/07-ROADMAP.md` section 4).

## 3. Module map

The code is split into nine modules. Each one owns some tables and some business rules. Other code asks a module for what it needs through its `index.ts` and never reaches inside it, so each rule lives in one place.

| Module | Owns | Public interface (examples of functions other code may call) |
| --- | --- | --- |
| `menu` | Categories, Menu Items, Option Groups, Options, Sold Out, Hidden | `getMenu()`, `getMenuItem(slug)`, `priceChoices(...)`, `setMenuItemSoldOut(...)` |
| `cafe` | Opening Hours, Special Hours, Capacity, Ordering Paused, the cafe's details and Amenities | `getOrderingDay(...)`, `pickupWindows(...)`, `pauseOrdering(...)`, `getCafeDetails()` |
| `cart` | Carts and Lines; Favourites (V1) | `getCart(owner)`, `addLine(...)`, `updateQuantity(...)`, `lockCart(...)` |
| `ordering` | Orders, Order Lines, Order Codes, Order Status, Pickup Window use | `placeOrder(input)`, `transition(orderId, to, actor)`, `getOrderForCustomer(id, token)` |
| `payments` | Payments, provider events, Refunds | `startPayment(...)`, `verifyWebhookEvent(...)`, `recordPaymentEvent(...)`, `refundPayment(...)` |
| `loyalty` | Star ledger, Rewards, Redemptions | `balance(memberId)`, `earnForOrder(order)`, `reserveRedemption(...)`, `releaseRedemption(...)` |
| `content` | Events and Posts; Sign-ups, Recurring Events and Inquiries (V1) | `getEvents()`, `getPost(slug)`, `saveEvent(...)`, `submitInquiry(...)` |
| `identity` | Members, Staff roles, sessions, audit log (wraps Better Auth) | `requireMember()`, `requireStaff("barista" \| "manager")`, `audit(actor, action, target)`, `staffMembers()`, `setRole(actor, email, role)`, `endSessions(actor, userId)` |
| `notify` | Email templates and sending | `sendOrderPlaced(order)`, `sendOrderReady(order)` |

Rules:

- A module touches only its own tables, by convention: nothing enforces it, and `rate_limits` belongs to `src/lib/rate-limit.ts`, which any module may call. Another module's data comes through its `index.ts`. An ESLint rule (ESLint is a tool that checks code for mistakes and broken rules) blocks imports of `src/modules/*/internal/**` from outside the module. A dynamic `import()` is the one shape it misses.
- Modules mostly return results the same way: reads return `null` when missing; business refusals return `{ ok: false, reason }`; form checks return `{ ok: false, errors }`; bugs throw and are caught at the edge. A few simple writes return `true` when done and `false` when there was nothing to do (`deleteOptionGroup`, `removeSignup`, `deletePost`).
- `placeOrder` coordinates `cafe`, `cart` (which prices through `menu`) and `loyalty` inside one database transaction (a group of changes that either all happen or none do). An online Order starts its `payments` checkout after the commit (section 6).

## 4. Routes and rendering

A route is an address on the site, such as `/menu`. This table lists every route, who may open it and how it is built:

- **Prerendered**: made ahead of time and shared by every visitor. A cache tag (a label such as `menu`) says which Staff changes refresh it.
- **Dynamic**: made fresh for each request, because it depends on who is asking.
- **Route handler**: answers with data or a file, not a page.

| Route | Who | Rendering |
| --- | --- | --- |
| `/` | Everyone | Prerendered: hero with a room photo, today's hours, Order ahead and Plan your visit; Barista Picks; printed menu; the space; next Event; latest Post; visit block (PRD INFO-08) |
| `/menu`, `/menu/[category]`, `/menu/item/[slug]` | Everyone | Prerendered; tagged `menu` |
| `/cafe` | Everyone | Prerendered; tagged `hours`: the space, Amenities, visit FAQ, story, directions. The "open now" badge is a tiny client island that reads the clock. Edits to the cafe's details also revalidate `hours` |
| `/concept` | Everyone | Static: About this concept (PRD INFO-10) |
| `/accessibility` | Everyone | Prerendered: the accessibility statement, linked from the footer (batch 9.3) |
| `/privacy`, `/sign-in` | Everyone | Privacy notice; email link and Google sign-in |
| `/cafe/inquire` (V1) | Everyone | Dynamic form; rate limited, with a hidden trap field and a 2-second minimum fill time (PRD INFO-11, audit SEC1-06; the Event Sign-up form has the same) |
| `/events`, `/events/[slug]`, `/news`, `/news/[slug]` | Everyone | Prerendered; tagged `content` |
| `/events/[slug]/calendar` (V1) | Everyone | Route handler: the Event as an iCalendar file (PRD EVT-04) |
| `/events/[slug]/signup/[id]` | The guest (Sign-up token in the email link) | Dynamic; confirms a waiting Sign-up within 30 minutes, or cancels one (8.7) |
| `/cart`, `/checkout` | Everyone | Dynamic (per Customer) |
| `/cart/line/[id]` | Everyone | Dynamic (per Customer): changes one Line's Options, quantity and note (section 5) |
| `/orders/[id]` | The Customer (Order token in the link) or the Member | Dynamic; polls for status |
| `/dev/pay/[id]` | The Customer | The `fake` checkout; not found unless the provider is `fake` (section 8) |
| `/account`, `/account/stars` | Members | Dynamic |
| `/bar` | Baristas, Managers | Dynamic; polls (section 11) |
| `/manage/*`: Today, menu (with categories and Option Groups), hours and Capacity, cafe details, events and recurring events (`/manage/events/weekly`), posts, orders, stars, staff; reports and inquiries in V1 | Managers; Baristas open `/manage` (Today) and `/manage/menu` for Sold Out (STAFF-03) | Dynamic |
| `/manage/two-factor` | Staff | Dynamic: sets up or asks for the Second Factor (ADR 0014) |
| `/api/webhooks/[provider]` | The payment provider (`paymongo` or `fake`) | Route handler; verifies the signature |
| `/api/cron/daily` | Vercel Cron | Route handler; secret header (section 12) |
| `/api/bar` | Baristas, Managers | Route handler; the Bar Screen polls it (section 11) |
| `/api/orders/[id]/status` | The Customer (Order token) | Route handler; the Order status page polls it. Its version also changes with the drinks ahead of an As Soon As Possible Order |
| `/orders/[id]/calendar` | The Customer (Order token) | Route handler; a calendar file for a Scheduled Pickup (`src/lib/calendar.ts`, shared with Events) |
| `/menu-photos/[name]` | Everyone | Route handler: serves a Menu Item photo saved without a Blob store (local runs and the e2e server; section 14) |
| `/api/account/export` | Members | Route handler: "Download my data" as JSON (ACC-03) |
| `/api/auth/*` | Better Auth | Route handler |

### Caching (Cache Components)

Next.js 16 can keep a stored copy (a cache) of the data a public page needs. Each copy carries a cache tag. When Staff save a change, the site expires that tag, and the next visitor gets fresh data. Pages stay fast because they are not rebuilt for every visitor.

- Public data loads through `"use cache"` functions with `cacheTag("menu")`, `cacheTag("hours")` or `cacheTag("content")`. Events also carry `"events"`, which a Sign-up expires, so Posts and the weekly list stay cached (audit PERF-14).
- Popular this week (MENU-09) reads Orders under `cacheTag("orders")` with an hourly lifetime and is never updated by tag.
- Every Staff change to cached data calls `updateTag` for its tag (Server Actions; route handlers use `revalidateTag(tag, "max")`). So the menu shows a Sold Out mark within seconds while pages stay static.
- Pause, Busy Mode, Capacity and Prep Time are read fresh, so their saves only `refresh()` the page (audit PERF-13).
- The menu readers use a `menu` profile (revalidate 10 seconds, expire 1 hour, in `next.config.ts`). The other public reads use `cacheLife("minutes")`. If two saves a moment apart race a cache refill and the old data is stored as fresh, the menu heals within about 10 seconds and the rest within a minute (MENU-04, audit staff:2).
- A dynamic route such as `/menu/[category]` may also serve its old page once after a save and the new one a few seconds later. The end-to-end tests look again until the change shows.
- Dynamic routes read `params` inside Suspense (a React boundary that shows a fallback while the part inside waits), as Partial Prefetching needs. The `partialPrefetching` flag itself is off since batch 7.6 (`next.config.ts`).
- Read the guides in `node_modules/next/dist/docs/` before using a Next API, and keep two rules. Dynamic routes (those with a `[name]` part) list their params in `generateStaticParams`. No `Date.now()`, `new Date()` or `Math.random()` while rendering, except inside cached functions or client islands.

### Theme

The site has two palettes, Day and Night ([ADR 0010](adr/0010-theme-follows-manila-time.md)). A small inline script in the root layout picks one in the browser before first paint, from the Manila hour plus any saved choice. So the server output is the same at every hour and stays cacheable. Copy that differs by palette (PRD INFO-12) is rendered in both versions and the palette shows one. The "open now" badge and the Last Order countdown (ORD-13) are client islands (small parts of a server-built page that run in the browser) that read the clock.

## 5. Cart and pricing

The Cart remembers what the Customer chose, never what it cost. The server works out prices fresh every time the Cart is shown, so a price change or a Sold Out item is always caught before checkout.

- A Cart belongs to a Guest (a random id in an HTTP-only cookie, a small note the browser keeps and sends back, which page scripts cannot read) or a Member. Signing in merges the Guest Cart into the Member's. The merge locks the Guest Cart row first, so two requests signing in at once merge it once.
- `priceChoices` (menu) validates the choice against the Menu Item's Option Groups (required groups present, min and max picks, no Sold Out or Hidden Option). It returns the Base Price (or today's Promo) plus the Price Deltas. The Cart stores choices, never prices.
- `getCart` prices every Line on each read and returns Line totals and the Order total. `placeOrder` applies at most one Reward (one unit of the dearest drink at zero; its Options still charge their Price Delta). VAT is included in prices; the receipt shows the VAT part with one rounding rule ([ADR 0002](adr/0002-money-as-integer-centavos.md)).
- A Line whose Menu Item became Sold Out or Hidden is flagged in the Cart and blocks checkout until removed.
- Adds and changes to one Cart wait their turn on its row, so none overwrites another. The Cart itself is created with an insert that does nothing when another request made it first. A Line's Options, quantity and note change from the Cart (`changeLine`, the Change link to `/cart/line/[id]`). A change that matches another Line joins it, up to 20.

## 6. Checkout and order placement

Placing an Order is one transaction: every step below succeeds together, or nothing is saved. This stops two people taking the last place in a Pickup Window, and stops one tap placing two Orders. Several steps use a row lock (`SELECT ... FOR UPDATE`): the database makes any other request that wants the same row wait until this one finishes.

`placeOrder(input)` runs in one transaction:

1. Reject when the cafe is closed for the chosen Pickup Time or Ordering Paused (`cafe`).
2. Lock the Cart row (`lockCart`, `SELECT ... FOR UPDATE`), so a second Place order on the same Cart (a double tap, a retry, two tabs) waits and then finds it empty. Price the Cart again on the server (`cart`, `menu`). Reject if anything changed since the Customer last saw it, and show the new total.
3. Lock the chosen Pickup Window's usage row (`SELECT ... FOR UPDATE`), check Capacity for drinks and food, and add this Order's counts. A full window returns `{ ok: false, reason: "window_full" }` with the next free window.
4. Reserve the Reward's Stars, if any (`loyalty`).
5. Create the Order with snapshot Lines (name, Options, prices), the next Order Code for the day, and the hash of its status-link token. The token is an HMAC of the Order id: a code made from the id and a server secret, which only the server can make ([`docs/04-DATA-MODEL.md`](04-DATA-MODEL.md) section 1).
6. Online payment: commit, then start the provider checkout (`payments`) and redirect. If the checkout won't start, nothing was charged: the Order Expires at once (window and Stars back) and its Lines go back in the Cart. Pay at Pickup: commit and show the status page.

Expired and cancelled Orders give back their Pickup Window counts and reserved Stars in the same transaction as their transition. A Refund gives nothing more back: the Order was already Cancelled, or was Picked Up and its earned Stars are taken back (section 10).

## 7. Order lifecycle

Every Order moves through a fixed set of steps, from Placed to Picked Up. Only the steps in this table are allowed, so an Order can never jump from Placed straight to Refunded. The last column says what else happens at each step.

| From | To | Who or what | Side effects |
| --- | --- | --- | --- |
| (none) | `placed` | `placeOrder` | Window counts taken; Stars reserved; "Order placed" email for Pay at Pickup |
| `placed` (online) | `paid` | Verified provider webhook | "Order placed" email |
| `placed` (online) | `expired` | 15 minutes unpaid (section 12; the payment webhook and the Order page's poll check too), or at once when its checkout won't start | Window and Stars released; checkout session expired |
| `placed` (Pay at Pickup), `paid` | `accepted` | Barista (or the visitor in Demo Mode, ADR 0015) | Prep Time starts |
| `accepted` | `preparing` | Barista (or Demo Mode) | None |
| `preparing` | `ready` | Barista (or Demo Mode) | "Ready for pickup" email; status page shows it |
| `ready` | `picked_up` | Barista, or Demo Mode (marks paid at the counter for Pay at Pickup) | Stars earned (`loyalty`); Redemption final |
| `placed`, `paid` | `cancelled` | Customer, before `accepted` | Window and Stars released; a paid Order goes on to `refunded` |
| any before `picked_up` | `cancelled` | Manager | Same as above; reason required |
| `placed` (Pay at Pickup) or `paid`, after its service day | `cancelled` | The daily cron (system) | Window and Stars released; reason "The day ended before it was picked up", or for a paid Order the bar never accepted "The day ended before we made it", which then goes on to `refunded` (audit DC-07) |
| `cancelled` (was paid), `picked_up` | `refunded` | Manager; also the system, right after a Customer or the daily cron cancels a paid Order | Full refund through the provider (cash at the counter for Pay at Pickup); Stars earned are taken back |

`transition(orderId, to, actor)` (in `src/modules/ordering/internal/status.ts`) checks the table, locks the Order row, applies side effects and writes an `order_events` row. Anything else is a bug and throws. A Pay at Pickup Order still `placed` after its service day is cancelled by the daily cron, so a Reward's Stars come back (audit ORD-13); so is a `paid` one the bar never accepted, which is then refunded (audit DC-07). One left `accepted`, `preparing` or `ready` stays for the Manager to close.

## 8. Payments

Hoshikopi never takes real money. Online payments go through a payment provider in test mode. The site believes a payment happened only when the provider's server says so in a webhook (a message the provider's server sends ours when a payment changes), never because of what the browser shows.

- Business code talks to a `PaymentProvider` interface (one shared set of functions that each provider fills in): `createCheckout`, `expireCheckout`, `refund`, `verifyWebhook`, `parseEvent` ([ADR 0003](adr/0003-payments-paymongo-test-mode.md)). Adapters (the provider-specific code behind it): `paymongo` and `fake`.
- **PayMongo in Test Mode only.** The adapter refuses to start if its secret key is not a test key (`sk_test_`), on every environment.
- **`fake`** has a hosted checkout at `/dev/pay/[id]` whose Pay button sends a signed webhook, so demos and tests run without a PayMongo account. When `NODE_ENV=production` it runs only on a local address, a `*.vercel.app` address or a Vercel preview, and only with `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_SECRET` set; anywhere else it refuses to start (`src/modules/payments/internal/provider.ts`).
- **The webhook route**:
  - It has the provider verify its signature header (`Paymongo-Signature`, or `fake-signature` for `fake`) over the raw body. A signature proves the message came from the provider and was not changed.
  - It then inserts the event under a unique `(provider, provider_event_id)`. A repeat is acknowledged and ignored (deduplicated). Only then does it transition the Order.
  - The Payment row is locked while an event is decided, so two events for one checkout never overwrite each other.
  - A paid event still counts after a failed attempt (a retry in the same checkout) and after the Order Expired or was Cancelled. The money was taken, so the Order is refunded in full right after the commit (a Refund row with actor `webhook`).
  - A paid event for an Order still Placed past its 15 minutes Expires it first, in the same transaction, so it takes that late path too (audit PAY-07).
  - Closing a checkout marks the Payment `expired` only after the provider confirms; a checkout with a payment going through stays open.
  - The browser's return page reads the Order, never the URL, to decide what to show.
- Refunds are full only (PRD PAY-05); the Refund row records the provider refund id. A refund that stopped after the provider refunded (Payment `refunded`, Refund row written, Order not moved) is finished by trying again. One still at the provider, with no Refund row, is left alone until refund webhooks exist (ADR 0003).
- Money that needs a person: an Order Expired or Cancelled whose Payment is still `paid` (the late refund above threw, or a Cancel's automatic Refund failed) is listed as **Needs a refund** at the top of `/manage/orders`, any day, and `refundOrder` takes it from the Manager. A late-paid Order was never Paid in its own record, so only the money goes back and its Order Status stays. Every server error is also one JSON line in the logs (`src/instrumentation.ts`, `onRequestError`), path without its query.

## 9. Pickup Windows, Capacity and Prep Time

([ADR 0007](adr/0007-pickup-windows-and-capacity.md))

The day is split into 15-minute Pickup Windows, and each window holds only so many drinks and food Lines (its Capacity). This stops the bar promising more than it can make. Prep Time is the site's estimate of how long an As Soon As Possible Order will take.

- A day is cut into 15-minute Pickup Windows from opening. The last one ends at closing time, and a window is offered only if it starts after now plus Prep Time. Orders are taken until Last Order (audit D-7). Capacity per window (drinks, food Lines) is set per day of the week; Special Hours close or shorten a day.
- `pickup_window_usage(day, window_start)` holds counts taken; `placeOrder` locks and updates it.
- **Prep Time** for As Soon As Possible: `base_minutes + per_drink_minutes × (drinks ahead + this Order's drinks − 1) + Busy Mode minutes`, rounded up to the next 5 minutes. Both numbers are Manager settings (defaults 4 and 1.5). For example, with the defaults, 2 drinks ahead and 1 drink in this Order: 4 + 1.5 × 2 = 7, rounded up to 10 minutes.
- Drinks ahead are those the bar is making (Accepted, Preparing) and the As Soon As Possible Orders waiting on the Bar Screen (Paid, or Placed Pay at Pickup). Scheduled Orders still waiting do not count (ADR 0007 update). As Soon As Possible takes the earliest window that starts after now + Prep Time and has room, and checkout shows it as "Ready by" that window.
- The checkout lists only windows with room, and says "Filling up" or "2 drinks left" on one close to full; the server checks again when placing. As Soon As Possible walks the offered windows in order under each one's row lock and takes the first with room, so a window that filled after it was offered passes to the next.
- **The hosted demo takes Orders all day** ([ADR 0015](adr/0015-demo-mode-visitor-plays-the-barista.md) update). `demoAllDayOrdering()` (`payments`) is true on a production build where Demo Mode runs: the live demo on `*.vercel.app`, its previews and the local e2e build. Then `orderingDay()` (`ordering`) swaps in 00:00 to 23:15 (Last Order; closing 23:59, so the last Pickup Window starts 23:30, audit DC-29) for checkout, placement, the Cart and the Bar Screen. Local development and tests keep the cafe's real hours. Pause, Busy Mode, Capacity and Prep Time still apply, and the pages that show Opening Hours still show the real ones.

## 10. Loyalty

([ADR 0008](adr/0008-stars-ledger.md))

Stars are kept like a bank statement, called a ledger. Every change is a new line, and the balance is the sum of all lines. Nothing is overwritten, so the history always explains the balance.

- Every change is a `star_entries` row: `earn` (Order Picked Up, +1 per drink unit), `reserve` (Redemption at placement, -9), `release` (Order Cancelled or Expired, +9), `reverse` (Refund after Picked Up, minus what was earned), `adjust` (Manager, with a reason), `birthday` (the Birthday Treat, +9).
- Balance is the sum of entries. Reserving checks the balance inside the same transaction that writes the entry, with the Member row locked, so two tabs cannot spend the same Stars.
- A Refund takes back what the Order earned, but never Stars already spent. Stars held by the Member's open Reward Orders still count as theirs, because the Reward may be cancelled. If a held Reward is then picked up, it gives back (`release`) what the Refund took from it, so spent Stars stay spent and the balance does not stay below zero (audit DC-06). Example: 7 Stars plus 2 earned on an Order, all 9 held by a Reward; the Order is refunded. Cancel the Reward: 7 left. Pick it up: 0 left.
- The Birthday Treat (V1) adds 9 Stars once a year in the Member's birthday month (Manila calendar), when they open their account or checkout.

## 11. Live updates

([ADR 0009](adr/0009-live-updates-by-polling.md))

Two screens need fresh news: the Bar Screen and the Order status page. Each asks the server again every few seconds, which is called polling. Polling is simpler than a live connection and is enough for one cafe.

- **Bar Screen.** It fetches `/api/bar` every 3 seconds with the last-seen board version and Sold Out stamp (today's marks and the Manila day), and the server answers "no change" cheaply. A new stamp refreshes the page, so the Sold Out panel shows another device's change and clears at midnight (audit DC-13). New Orders are also announced in the screen's live region, not only chimed (audit a11y:15).
  - The version covers the Orders, the pause, Busy Mode, the Prep Time and how many Orders are make-next, so a Scheduled Order coming due refreshes the board.
  - A new Order plays a sound and highlights its card in New for 4 seconds. The sound needs one tap after each load (browsers start audio suspended), and the board says "Tap to turn on sound" until then.
  - The board asks the tablet to stay awake (Screen Wake Lock, asked again when the page shows), since a sleeping tablet stops polling (audit staff:22, FEAT-11).
  - Signed out, `/api/bar` answers 401 JSON (not a redirect), and the board stops polling and says so, with a link to sign in again.
- **Order status page.** It polls every 5 seconds until `ready` (15 while the tab is hidden, so it can still alert), then every 30 seconds while the tab shows, until `picked_up` or closed. It stops 3 hours past the Pickup Time and its last change, says so, and checks once when the tab comes back. So a forgotten tab can't keep the database awake (audit ops:14).
- Server-Sent Events or a hosted realtime service are a later upgrade if polling cost or delay is measured as a problem.

## 12. Jobs and time

Vercel's free Hobby plan runs a scheduled job (a cron job) only once a day. So anything urgent, like freeing the room an unpaid Order holds, happens whenever someone loads a page. The daily job only tidies up.

- **Expiry on read.** Unpaid online Orders older than 15 minutes are expired whenever Pickup Windows, the Bar Screen or an Order are loaded, including each poll of the Order page. The payment webhook also expires one before it pays it. Both work in the same transaction style as section 6.
- **The daily cron** (`/api/cron/daily`, before opening; schedule in `vercel.json`, 22:00 UTC) runs only with the `Authorization: Bearer <CRON_SECRET>` header that Vercel Cron sends, compared in constant time (`src/lib/secret.ts`, audit SEC1-21). It:
  - expires anything the sweeps on read missed;
  - cancels earlier days' Pay at Pickup Orders still Placed, and paid ones the bar never accepted, which are then refunded (section 7, audit DC-07);
  - deletes rate-limit rows older than a day and guest Carts untouched for 30 days;
  - in Demo Mode, moves the seeded demo Events forward and renews the demo Promo and Seasonal drink (ADR 0015);
  - refreshes the `menu` tag so yesterday's Sold Out marks clear.
- Order Codes restart by themselves each Service Day.
- All "now" values come from one `clock` helper (`src/lib/clock.ts`) so tests can freeze time.

## 13. Accounts, Staff and security

Members and Staff sign in without passwords: by an emailed link or with Google. Staff also enter a 6-digit code from an authenticator app, the Second Factor. This section also lists the limits and protections that stop abuse.

- **Better Auth** ([ADR 0005](adr/0005-better-auth-members-and-staff.md)), the sign-in library: Members sign in with an email link (sent through Resend) or Google. Staff are users with a `role` of `barista` or `manager`, given a role by a Manager at `/manage/staff` once they have signed in (STAFF-10). Staff sign in like Members (email link or Google). They must enter a Second Factor (TOTP, a time-based one-time code) once per session before using `/manage`. `requireStaff()` checks it, rather than Better Auth's plugin ([ADR 0014](adr/0014-staff-second-factor-in-identity.md)).
- **Guards.** `requireMember()` and `requireStaff(role)` guard pages, Server Actions and route handlers; every Staff write goes through `audit()`. Each guard checks, in the same read as the user, that the session row still exists. So Sign out everywhere, a role taken away or a deleted account takes effect on the next request (audit staff:17). `requireStaff` asks for a Second Factor under 12 hours old on every call except a Barista's taps on the Bar Screen (ADR 0014).
- **Sign-in links.** A link's token is stored only as its SHA-256 hash (a one-way fingerprint: the database copy cannot be turned back into a working link), like Order link tokens (SEC1-13). A used or expired link comes back to `/sign-in?link=expired`, which says so and keeps where it was going; someone still signed in just gets that page. Deleting an account also ends that person's pending links and removes their sign-in limit rows. The daily cron forgets rate-limit rows older than a day.
- **Rate limits** (Postgres-backed, `src/lib/rate-limit.ts`). A rate limit caps how many tries one person or address gets in a period. The limits on what anyone can send without being Staff live together in `src/lib/limits.ts`, and `tests/db/limits.test.ts` checks every number below (audit DC-11).

  | What | Limit |
  | --- | --- |
  | Sign-in emails | Per IP first (30 per 15 minutes), then per address from that IP (3) and per address from anywhere (15), so a stranger needs five connections, not two, to use up someone's links (audit ID2-05, DC-09) |
  | Google sign-in starts | Per IP (30 per 15 minutes) |
  | Checkout tries | Per Cart (10 per 15 minutes) and per IP (20) |
  | Pay at Pickup Orders | Per IP for Guests (10 a day; audit ORD-14) and per account for Members (5 a day; audit DC-08) |
  | Webhook calls | Per IP (120 a minute); a body over 64 kB is refused with 413 (audit SEC1-10) |
  | Second Factor tries | Per Staff member (10 per 15 minutes) |
  | Event Sign-ups (V1) | Per IP (10 an hour), and 2 that went through per IP per Event a day |
  | Inquiries (V1) | Per IP (5 an hour) |
  | Sign-in link checks | Better Auth's own limit, 60 a minute per IP |

- **Security headers** (in `next.config.ts`): a Content-Security-Policy (a list of where the browser may load scripts and other files from) locked to this site. PayMongo's checkout is a redirect, so there are no third-party scripts on our pages. Scripts need `'unsafe-inline'` because prerendered pages carry Next's inline RSC scripts, which take no nonce or hash ([ADR 0013](adr/0013-csp-allows-inline-scripts.md)). Also HSTS (always use HTTPS), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy: same-origin` (a page never shares a window with one it opened; sign-in and checkout leave by redirect). `poweredByHeader: false` keeps the framework's name out of the headers (audit ops:20).
- **Input checks.** Every input is parsed with zod (a library that checks data has the expected shape) where it enters a module. Server Actions and route handlers pass the raw strings to a module function, which parses them (no file under `src/app` imports zod). Fields a Customer types refuse hidden control characters (`plainText`, `src/lib/text.ts`); a Cart note and an account name leave them out. The proxy (`src/proxy.ts`) answers an address with broken percent-encoding or a NUL with the not-found page. Postgres refuses a NUL, and Next had no page to render its 400 for broken encoding, so both gave a bare 500 (audit SEC2-10).
- **Privacy** (Data Privacy Act): a privacy notice, marketing email only with a separate opt-in, Member data export and deletion (orders are kept, de-identified, for the cafe's records).
  - The export holds the profile, Orders with their contact details and notes, Star history, Favourites, and Event Sign-ups and Inquiries under the Member's email.
  - Deletion runs in one transaction. Orders, Sign-ups and Inquiries lose the person. Star entries stay (so past totals hold) without the Manager's notes. The Cart, Favourites and sign-in records go (audit ID2-09, SEC1-19, DATA-08, architecture:9).

## 14. Content and images

Events, Posts and the cafe's texts are written by the Manager in `/manage` and stored in the database. Menu Item photos are uploaded through `/manage`. Photos of the room are files in the code.

- Events and Posts live in the database with a Markdown body (plain text with simple marks for headings and links), written in `/manage` with a plain editor and preview. They are rendered with `react-markdown` (no raw HTML).
- **Menu photos** upload through a Server Action that checks the role, the size (2 MB) and the real image type. It re-encodes the photo without its metadata (sharp; EXIF can hold a location), saves the Menu Item, and only then `put`s the photo to Vercel Blob under `menu/`. Vercel Blob is used when `BLOB_STORE_ID` is set, signing in with Vercel's OIDC token. With no store, as in local runs, photos go to `data/menu-photos/` and `/menu-photos/<name>` serves them. The photo it replaces is deleted. `next/image` serves them in AVIF or WebP and allows only this store's host, worked out from `BLOB_STORE_ID` at build time (audit ops:7, ops:15, PERF-04). Stand-in photos are listed with their source and licence in [`docs/ASSETS.md`](ASSETS.md).
- Room photos are static files in the repo, not uploads: the room rarely changes. Each is labelled "Concept image" (PRD section 2). The space paragraph, directions and story are Markdown on `cafe_settings`, rendered like Posts.
- Share cards (PRD INFO-09), the preview a chat app shows for a link: Menu Item, Event and Post pages share their own photo and alt text; every other page shares one static branded image. Read the metadata guide in `node_modules/next/dist/docs/` before changing them.

## 15. Testing

Automated tests check the rules in this document every time the code changes. The riskiest parts (money, Capacity, Stars and Order Status) are built test-first: the test is written before the code.

| Layer | Tool | Covers |
| --- | --- | --- |
| Unit and module | Vitest against a real test database | Pricing, Option rules, Rewards, Capacity, Prep Time, every Order Status transition, Star ledger, webhook dedupe |
| End to end | Playwright on a production build | Order as Guest with the `fake` provider; Pay at Pickup; Bar Screen flow; Member earns and redeems Stars; Manager marks Sold Out |
| Accessibility | axe in every Playwright page test | WCAG 2.0, 2.1 and 2.2 level A and AA rules (axe tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) at phone and desktop width |
| Speed | Lighthouse (mobile) on the menu and Home | Section 7 of the PRD |

Vitest runs unit and database tests; Playwright drives a real browser through the site; axe checks accessibility; Lighthouse measures speed. Money, Capacity, Stars and Order Status are built test-first (the `tdd` skill). How to run each one: [`docs/06-SETUP.md`](06-SETUP.md) section 7.
