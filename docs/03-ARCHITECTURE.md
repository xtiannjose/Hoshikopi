# Architecture

Status: draft v0.1, 2026-10-30. How Hoshikopi is built. Scope comes from `docs/01-PRD.md`, words from `GLOSSARY.md`, tables from `docs/04-DATA-MODEL.md`. Changing a rule here that an ADR decided needs a new ADR.

## 1. Principles

1. **One Next.js app, organised in modules** ([ADR 0001](adr/0001-modular-monolith-nextjs.md)). Customer pages, Staff pages, webhooks and jobs deploy together; business logic lives in `src/modules/*`, each with one public `index.ts`.
2. **Server Components by default.** `"use client"` only for leaf components with state or browser APIs (Option picker, Cart drawer, Bar Screen list).
3. **The server decides money.** Prices, Price Deltas, Rewards and totals are recomputed on the server at every step; integer centavos everywhere ([ADR 0002](adr/0002-money-as-integer-centavos.md)).
4. **Order Status is a state machine.** Only the transitions in section 7 exist, each in one function with its side effects.
5. **Public pages are prerendered.** Menu, cafe, Events and Posts render at build time and refresh by cache tag when Staff change them (section 4).
6. **Manila time at the edges.** Store UTC; Opening Hours, Special Hours and Pickup Windows are defined and shown in `Asia/Manila`.
7. **No real money, ever** ([ADR 0006](adr/0006-concept-project-no-real-money.md)). The payment layer refuses live keys.
8. **Boring first.** Polling before sockets, a table before a queue, one cafe before many. Each upgrade waits for a measured need.

## 2. System context

```
 Customer phone ──┐                         ┌── PayMongo (Test Mode): hosted checkout, webhooks
                  │                         │
 Staff tablet ────┼──> Next.js 16 on Vercel ┼── Neon PostgreSQL (Singapore), through Prisma
 (Bar Screen,     │    (pages, Server        │
  manage pages)   │     Actions, route       ├── Resend: order and sign-in emails
                  │     handlers, cron)      │
 Google sign-in ──┘                         └── Vercel Blob: menu, Event and Post photos
```

No other services. Search, analytics and error tracking are added only when a phase needs them (`docs/07-ROADMAP.md`). Today the demo runs the `fake` provider in place of PayMongo (ADR 0003 update) and sends no email through Resend until a domain exists (`docs/07-ROADMAP.md` section 4).

## 3. Module map

| Module | Owns | Public interface (examples) |
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
- A module touches only its own tables. Another module's data comes through its `index.ts`. An ESLint import rule blocks `src/modules/*/internal/**` from outside the module.
- Modules return results the same way: reads return `null` when missing; business refusals return `{ ok: false, reason }`; form checks return `{ ok: false, errors }`; bugs throw and are caught at the edge.
- `placeOrder` coordinates `cafe`, `cart` (which prices through `menu`) and `loyalty` inside one database transaction; an online Order starts its `payments` checkout after the commit (section 6).

## 4. Routes and rendering

| Route | Who | Rendering |
| --- | --- | --- |
| `/` | Everyone | Prerendered: hero with a room photo, today's hours, Order ahead and Plan your visit; Barista Picks; printed menu; the space; next Event; latest Post; visit block (PRD INFO-08) |
| `/menu`, `/menu/[category]`, `/menu/item/[slug]` | Everyone | Prerendered; tagged `menu` |
| `/cafe` | Everyone | Prerendered; tagged `hours`: the space, Amenities, visit FAQ, story, directions. The "open now" badge is a tiny client island that reads the clock. Edits to the cafe's details also revalidate `hours` |
| `/concept` | Everyone | Static: About this concept (PRD INFO-10) |
| `/privacy`, `/sign-in` | Everyone | Privacy notice; email link and Google sign-in |
| `/cafe/inquire` (V1) | Everyone | Dynamic form; rate limited (PRD INFO-11) |
| `/events`, `/events/[slug]`, `/news`, `/news/[slug]` | Everyone | Prerendered; tagged `content` |
| `/events/[slug]/calendar` (V1) | Everyone | Route handler: the Event as an iCalendar file (PRD EVT-04) |
| `/events/[slug]/signup/[id]` | The guest (Sign-up token in the email link) | Dynamic; confirms a waiting Sign-up within 30 minutes, or cancels one (8.7) |
| `/cart`, `/checkout` | Everyone | Dynamic (per Customer) |
| `/orders/[id]` | The Customer (Order token in the link) or the Member | Dynamic; polls for status |
| `/dev/pay/[id]` | The Customer | The `fake` checkout; not found unless the provider is `fake` (section 8) |
| `/account`, `/account/stars` | Members | Dynamic |
| `/bar` | Baristas, Managers | Dynamic; polls (section 11) |
| `/manage/*` (menu, hours, capacity, cafe details, events and recurring events, posts, orders, stars, staff; reports and inquiries in V1) | Managers; Baristas open `/manage` (Today) and `/manage/menu` for Sold Out (STAFF-03) | Dynamic |
| `/manage/two-factor` | Staff | Dynamic: sets up or asks for the Second Factor (ADR 0014) |
| `/api/webhooks/[provider]` | The payment provider (`paymongo` or `fake`) | Route handler; verifies the signature |
| `/api/cron/daily` | Vercel Cron | Route handler; secret header |
| `/api/bar` | Baristas, Managers | Route handler; the Bar Screen polls it (section 11) |
| `/api/orders/[id]/status` | The Customer (Order token) | Route handler; the Order status page polls it. Its version also changes with the drinks ahead of an As Soon As Possible Order |
| `/orders/[id]/calendar` | The Customer (Order token) | Route handler; a calendar file for a Scheduled Pickup (`src/lib/calendar.ts`, shared with Events) |
| `/api/account/export` | Members | Route handler: "Download my data" as JSON (ACC-03) |
| `/api/auth/*` | Better Auth | Route handler |

Cache Components (Next.js 16): public data loads through `"use cache"` functions with `cacheTag("menu")`, `cacheTag("hours")` or `cacheTag("content")`; Popular this week (MENU-09) reads Orders under `cacheTag("orders")` with an hourly lifetime and is never updated by tag. Every Staff change calls `updateTag` for its tag (Server Actions; route handlers use `revalidateTag(tag, "max")`), so the menu shows a Sold Out mark within seconds while pages stay static. Public reads use `cacheLife("minutes")`: if two saves a moment apart race a cache refill and the old data is stored as fresh, it heals within a minute (MENU-04). A dynamic route such as `/menu/[category]` may also serve its old page once after a save and the new one a few seconds later; the end-to-end tests look again until the change shows. Dynamic routes read `params` inside Suspense, as Partial Prefetching needs. Read the guides in `node_modules/next/dist/docs/` before using a Next API, and keep two rules: dynamic routes list their params in `generateStaticParams`; no `Date.now()`, `new Date()` or `Math.random()` while rendering, except inside cached functions or client islands.

Theme ([ADR 0010](adr/0010-theme-follows-manila-time.md)): the Day or Night palette is picked in the browser before first paint by a small inline script in the root layout (Manila hour plus any saved choice), so the server output is the same at every hour and stays cacheable. Copy that differs by palette (PRD INFO-12) is rendered in both versions and the palette shows one. The "open now" badge and the Last Order countdown (ORD-13) are tiny client islands that read the clock.

## 5. Cart and pricing

- A Cart belongs to a Guest (a random id in an HTTP-only cookie) or a Member. Signing in merges the Guest Cart into the Member's. The merge locks the Guest Cart row first, so two requests signing in at once merge it once.
- `priceChoices` (menu) validates the choice against the Menu Item's Option Groups (required groups present, min and max picks, no Sold Out or Hidden Option) and returns the Base Price (or today's Promo) plus the Price Deltas. The Cart stores choices, never prices.
- `getCart` prices every Line on each read and returns Line totals and the Order total. `placeOrder` applies at most one Reward (one unit of the dearest drink at zero; its Options still charge their Price Delta). VAT is included in prices; the receipt shows the VAT part with one rounding rule ([ADR 0002](adr/0002-money-as-integer-centavos.md)).
- A Line whose Menu Item became Sold Out or Hidden is flagged in the Cart and blocks checkout until removed.

## 6. Checkout and order placement

`placeOrder(input)` runs in one transaction:

1. Reject when the cafe is closed for the chosen Pickup Time or Ordering Paused (`cafe`).
2. Lock the Cart row (`lockCart`, `SELECT ... FOR UPDATE`), so a second Place order on the same Cart (a double tap, a retry, two tabs) waits and then finds it empty. Price the Cart again on the server (`cart`, `menu`). Reject if anything changed since the Customer last saw it, and show the new total.
3. Lock the chosen Pickup Window's usage row (`SELECT ... FOR UPDATE`), check Capacity for drinks and food, and add this Order's counts. A full window returns `{ ok: false, reason: "window_full" }` with the next free window.
4. Reserve the Reward's Stars, if any (`loyalty`).
5. Create the Order with snapshot Lines (name, Options, prices), the next Order Code for the day, and the hash of its status-link token (an HMAC of the Order id, `docs/04-DATA-MODEL.md` section 1).
6. Online payment: commit, then start the provider checkout (`payments`) and redirect. Pay at Pickup: commit and show the status page.

Expired and cancelled Orders give back their Pickup Window counts and reserved Stars in the same transaction as their transition. A Refund gives nothing more back: the Order was already Cancelled, or was Picked Up and its earned Stars are taken back (section 10).

## 7. Order lifecycle

| From | To | Who or what | Side effects |
| --- | --- | --- | --- |
| (none) | `placed` | `placeOrder` | Window counts taken; Stars reserved; "Order placed" email for Pay at Pickup |
| `placed` (online) | `paid` | Verified provider webhook | "Order placed" email |
| `placed` (online) | `expired` | 15 minutes unpaid (section 12) | Window and Stars released; checkout session expired |
| `placed` (Pay at Pickup), `paid` | `accepted` | Barista (or the visitor in Demo Mode, ADR 0015) | Prep Time starts |
| `accepted` | `preparing` | Barista (or Demo Mode) | None |
| `preparing` | `ready` | Barista (or Demo Mode) | "Ready for pickup" email; status page shows it |
| `ready` | `picked_up` | Barista, or Demo Mode (marks paid at the counter for Pay at Pickup) | Stars earned (`loyalty`); Redemption final |
| `placed`, `paid` | `cancelled` | Customer, before `accepted` | Window and Stars released; a paid Order goes on to `refunded` |
| any before `picked_up` | `cancelled` | Manager | Same as above; reason required |
| `cancelled` (was paid), `picked_up` | `refunded` | Manager; also the system, right after a Customer cancels a paid Order | Full refund through the provider (cash at the counter for Pay at Pickup); Stars earned are taken back |

`transition(orderId, to, actor)` checks the table, locks the Order row, applies side effects and writes an `order_events` row. Anything else is a bug and throws. An Order left `ready` at closing stays `ready` for the Manager to close (V1 may add "not collected").

## 8. Payments

- Business code talks to a `PaymentProvider` interface: `createCheckout`, `expireCheckout`, `refund`, `verifyWebhook`, `parseEvent` ([ADR 0003](adr/0003-payments-paymongo-test-mode.md)). Adapters: `paymongo` and `fake`.
- **PayMongo in Test Mode only.** The adapter refuses to start if its secret key is not a test key (`sk_test_`), on every environment.
- **`fake`** has a hosted checkout at `/dev/pay/[id]` whose Pay button sends a signed webhook, so demos and tests run without a PayMongo account. It refuses to run when `NODE_ENV=production` and the host is not a preview or local address.
- The webhook route has the provider verify its signature header (`Paymongo-Signature`, or `fake-signature` for `fake`) over the raw body, then inserts the event under a unique `(provider, provider_event_id)`; a repeat is acknowledged and ignored. Only then does it transition the Order. The Payment row is locked while an event is decided, so two events for one checkout never overwrite each other. A paid event still counts after a failed attempt (a retry in the same checkout) and after the Order Expired or was Cancelled: the money was taken, so the Order is refunded in full right after the commit (a Refund row with actor `webhook`). Closing a checkout marks the Payment `expired` only after the provider confirms; a checkout with a payment going through stays open. The browser's return page reads the Order, never the URL, to decide what to show.
- Refunds are full only (PRD PAY-05); the Refund row records the provider refund id.

## 9. Pickup Windows, Capacity and Prep Time

([ADR 0007](adr/0007-pickup-windows-and-capacity.md))

- A day is cut into 15-minute Pickup Windows from opening to the last order time. Capacity per window (drinks, food Lines) is set per day of the week; Special Hours close or shorten a day.
- `pickup_window_usage(day, window_start)` holds counts taken; `placeOrder` locks and updates it.
- **Prep Time** for As Soon As Possible: `base_minutes + per_drink_minutes × (drinks ahead + this Order's drinks − 1) + Busy Mode minutes`, rounded up to the next 5 minutes; both numbers are Manager settings (defaults 4 and 1.5). Drinks ahead are those the bar is making (Accepted, Preparing) and the As Soon As Possible Orders waiting on the Bar Screen (Paid, or Placed Pay at Pickup); Scheduled Orders still waiting do not count (ADR 0007 update). ASAP takes the earliest window that starts after now + Prep Time and has room, and checkout shows it as "Ready by" that window.
- The checkout lists only windows with room; the server checks again when placing.

## 10. Loyalty

([ADR 0008](adr/0008-stars-ledger.md))

- Every change is a `star_entries` row: `earn` (Order Picked Up, +1 per drink unit), `reserve` (Redemption at placement, -9), `release` (Order Cancelled or Expired, +9), `reverse` (Refund after Picked Up, minus what was earned), `adjust` (Manager, with a reason), `birthday` (the Birthday Treat, +9).
- Balance is the sum of entries. Reserving checks the balance inside the same transaction that writes the entry, with the Member row locked, so two tabs cannot spend the same Stars.
- The Birthday Treat (V1) adds 9 Stars once a year in the Member's birthday month (Manila calendar), when they open their account or checkout.

## 11. Live updates

([ADR 0009](adr/0009-live-updates-by-polling.md))

- The Bar Screen fetches `/api/bar` every 3 seconds with the last-seen board version; the server answers "no change" cheaply. The version covers the Orders, the pause, Busy Mode, the Prep Time and how many Orders are make-next, so a Scheduled Order coming due refreshes the board. A new Order plays a sound and highlights its card. Signed out, `/api/bar` answers 401 JSON (not a redirect), and the board stops polling and says so, with a link to sign in again.
- The Order status page polls every 5 seconds until `ready`, then every 30 seconds until `picked_up` or closed.
- Server-Sent Events or a hosted realtime service are a later upgrade if polling cost or delay is measured as a problem.

## 12. Jobs and time

- Vercel Hobby runs cron once a day, so time-critical work does not wait for cron: unpaid online Orders older than 15 minutes are expired **on read** whenever Pickup Windows, the Bar Screen or an Order are loaded, in the same transaction style as section 6. The daily cron (`/api/cron/daily`, before opening) sweeps anything left and refreshes the `menu` tag so yesterday's Sold Out marks clear; Order Codes restart by themselves each service day.
- All "now" values come from one `clock` helper so tests can freeze time.

## 13. Accounts, Staff and security

- **Better Auth** ([ADR 0005](adr/0005-better-auth-members-and-staff.md)): Members sign in with an email link (sent through Resend) or Google. Staff are users with a `role` of `barista` or `manager`, given a role by a Manager at `/manage/staff` once they have signed in (STAFF-10); Staff sign in like Members (email link or Google) and must enter a Second Factor (TOTP) once per session before using `/manage`, checked by `requireStaff()` rather than Better Auth's plugin ([ADR 0014](adr/0014-staff-second-factor-in-identity.md)).
- `requireMember()` and `requireStaff(role)` guard pages, Server Actions and route handlers; every Staff write goes through `audit()`.
- Rate limits (Postgres-backed): sign-in emails per address (3 per 15 minutes) and IP (30), checkout tries per Cart (10 per 15 minutes) and IP (20), webhook calls per IP (120 a minute), Second Factor tries per Staff member (10 per 15 minutes), Inquiries per IP (V1).
- Security headers: a Content-Security-Policy locked to this site (PayMongo's checkout is a redirect, so no third-party scripts on our pages); scripts need `'unsafe-inline'` because prerendered pages carry Next's inline RSC scripts, which take no nonce or hash ([ADR 0013](adr/0013-csp-allows-inline-scripts.md)); HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Every input is parsed with zod at the edge (Server Action or route handler).
- Privacy (Data Privacy Act): a privacy notice, marketing email only with a separate opt-in, Member data export and deletion (orders are kept, de-identified, for the cafe's records).

## 14. Content and images

- Events and Posts live in the database with a Markdown body, written in `/manage` with a plain editor and preview; rendered with `react-markdown` (no raw HTML).
- Menu photos upload through a Server Action that checks the role, the size (2 MB) and the real image type, then `put`s them to Vercel Blob under `menu/` (`BLOB_STORE_ID` with Vercel's OIDC token; `public/menu/` when there is no store, as in local runs); `next/image` serves them in AVIF or WebP. Stand-in photos are listed with their source and licence in `docs/ASSETS.md` (created in Phase 1).
- Room photos are static files in the repo, not uploads: the room rarely changes. Each is labelled "Concept image" (PRD section 2). The space paragraph, directions and story are Markdown on `cafe_settings`, rendered like Posts.
- Share cards (PRD INFO-09): Menu Item, Event and Post pages share their own photo and alt text; every other page shares one static branded image. Read the metadata guide in `node_modules/next/dist/docs/` before building them.

## 15. Testing

| Layer | Tool | Covers |
| --- | --- | --- |
| Unit and module | Vitest against a real test database | Pricing, Option rules, Rewards, Capacity, Prep Time, every Order Status transition, Star ledger, webhook dedupe |
| End to end | Playwright on a production build | Order as Guest with the `fake` provider; Pay at Pickup; Bar Screen flow; Member earns and redeems Stars; Manager marks Sold Out |
| Accessibility | axe in every Playwright page test | WCAG 2.2 A and AA rules at phone and desktop width |
| Speed | Lighthouse (mobile) on the menu and Home | Section 7 of the PRD |

Money, Capacity, Stars and Order Status are built test-first (the `tdd` skill).
