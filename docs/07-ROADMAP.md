# Roadmap and build plan

> **In plain words:** this is the build plan for Hoshikopi: the order the site was built in, what each piece delivered, where the project stands today and what comes next. Work is cut into phases (big stages) and batches (small pieces of work). Section 0 is the one to read first. Sections 5 to 12 are the history of every batch, kept as it was written.
>
> **Who should read it:** the owner and any project manager (sections 0 to 4 and 13), and a developer about to pick up a batch (also sections 3 and 14).
> **Last checked:** 2026-11-17.

## Contents

0. [Where we are](#0-where-we-are)
1. [Timeline at a glance](#1-timeline-at-a-glance)
2. [Tech stack and where it is used](#2-tech-stack-and-where-it-is-used)
3. [How every batch is worked](#3-how-every-batch-is-worked)
4. [Decisions along the way](#4-decisions-along-the-way)
5. [Phase 0: Foundation](#5-phase-0-foundation-1-week)
6. [Phase 1: Menu and cafe info](#6-phase-1-menu-and-cafe-info-15-weeks)
7. [Phase 2: Cart, checkout, Pay at Pickup, Bar Screen](#7-phase-2-cart-checkout-pay-at-pickup-bar-screen-2-weeks)
8. [Phase 3: Online payments in Test Mode](#8-phase-3-online-payments-in-test-mode-1-week)
9. [Phase 4: Members and Stars](#9-phase-4-members-and-stars-1-week)
10. [Phase 5: Events, news, polish and demo deploy](#10-phase-5-events-news-polish-and-demo-deploy-15-weeks)
11. [Phase 6: V1 features](#11-phase-6-v1-features-2-weeks)
12. [Phases 7 to 11: audit fixes, improvements, portfolio review, the rest of the backlog, handoff](#12-phases-7-to-11-audit-fixes-improvements-portfolio-review-the-rest-of-the-backlog-handoff)
13. [After V1](#13-after-v1-not-scheduled)
14. [Definition of done](#14-definition-of-done-every-batch)

## How to read this plan

- A **phase** is a big stage of the build, such as "Members and Stars". A phase is finished when its **exit criteria** (checks that must be visibly true) are met.
- A **batch** is one small piece of a phase, numbered like 4.2 (phase 4, batch 2). Each batch is built on its own branch, a separate copy of the code. A pull request then merges it into `main`, the main code.
- `[x]` in front of a batch means it is done. `[ ]` means it is not.
- Each batch is one short line: what it was for, then when it was done. The build notes are folded under **How it was done**; open it when you need the details.
- Scope, meaning what the site must do, is in `docs/01-PRD.md` (the product requirements document). Its requirement IDs (MENU-01, ORD-03...) link a feature to the batch that built it.
- Weeks are estimates for one developer working part time. Dates move; the order does not.

## 0. Where we are

_Updated 2026-11-18._

**In short:** Hoshikopi is built and live as a demo. Everything planned for the first version (the MVP) and the second (V1) works, and the audit backlog (the list of problems a deep review found) is cleared. Phase 11 (handoff docs and a last round of fixes) and Phase 12 (the owner's requests) are done. A few steps wait on the owner; they are listed at the end of this section.

### Planned and designed

- **Planning: done.** `GLOSSARY.md` (the shared word list), the PRD (`docs/01-PRD.md`, what the site must do), research, architecture, data model, design system, setup, tooling and ADRs 0001 to 0010 are written. ADRs 0011 to 0015 followed during the build. (An ADR is a short note that records one decision and why.)
- **Added 2026-10-30:** the cafe as a place (research Part 2, PRD INFO-04 to INFO-11) and the design direction (ADR 0010: Night layout, Day and Night palettes by Manila time).
- **Wireframes** (rough sketches of each page): Day and Night canvases with the same boards (`docs/05-DESIGN-SYSTEM.md` section 1.2). Twelve boards each: Home (laptop and phone), Hoshi Latte, Visit page, Cart and checkout, Order status, Star Card and account, Events, a Post, About this concept, Bar Screen, Manager pages (Today, Menu, Hours and capacity). Not wireframed: the other `/manage` forms and V1 features.

### Built

- **Phases 0 to 6 are done.** Phase 5 is the MVP and Phase 6 is V1. Two batches did not go as first planned:
  - 3.4 (the PayMongo adapter) was skipped. There is no PayMongo account, and PayMongo paused new sign-ups in November 2026, so the demo runs on `fake`, the built-in pretend payment provider.
  - 6.5 (Filipino language) was dropped.
- **The November audit is finished** (`docs/audit/`). It reviewed 16 areas and found 371 findings. A second reviewer double-checked each one. They were merged into 205 open items and ranked in `docs/audit/2026-11-13.md`: 2 P0, 18 P1, 142 P2 and 43 P3. Another 48 were already fixed, 16 were out of scope and 1 was refuted.
  - P0 to P3 are priorities. P0 means fix now: someone could exploit it, or money or data could be lost. P1 is fix next, P2 is fix soon, and P3 is small gaps and polish.
  - The P0 and P1 items became batches 7.7 to 7.11.
- **Fixes done so far:**
  - 7.1 to 7.4, the serious bugs.
  - 7.6 Performance budget.
  - 8.1 Demo mode for visitors, 8.2 What the docs promise, 8.3 Phone experience, 8.4 Busy Mode, 8.5 Staff management, 8.6 Order page handoff, 8.7 Event Sign-up protection and 8.8 Database driver warning.
  - 8.9 Motion pass and 8.10 Page polish, both added at the owner's request.
  - 7.5 to 7.12 and Phase 9 (2026-11-14): both P0s and 17 of the 18 P1s are fixed, and ops:8 (the seeded demo dates) waits on the owner.
- **Phase 10, the rest of the audit backlog, is done (2026-11-17):** all 21 batches, so no P2 is open. The 43 P3s are scheduled in Phase 11 (owner, 2026-11-17).

### Live

- **The demo is live** on Vercel (the company that hosts the site) and Neon (the company that hosts the database), at https://hoshikopi.vercel.app. Payments run on `fake`, so no money moves.
- **Google sign-in is live** (2026-11-07, ADR 0005 update), and the account page was redesigned (PR #53, a pull request).
- **The code lives on GitHub** (https://github.com/xtiannjose/Hoshikopi), its only copy.

### Next

- **Phase 11 is done** (2026-11-17, pull requests #111 to #120): handoff docs, every deep check fix, and the November audit's last 43 items.
- **Phase 12 is done** (2026-11-18, pull requests #121 to #128): the owner's requests, batches 12.1 to 12.8, live. Batch 12.7 brought these status lines up to date, and 12.8 made a published change show on the next visit.
- **Settings done by the owner (2026-11-18):** Vercel's `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` for Production only and the Singapore (`sin1`) function region; Dependabot alerts on and the CI check required for `main` on GitHub; xtianjose02@gmail.com made a Manager; the second PC updated (`npm ci`, `npx playwright install`); 19 menu photos uploaded on the live site, the last step of batch 5.4.
- **New features are on hold** (owner).

### Waiting on the owner

- **ops:8.** The seeded demo dates (Events, Promo, Seasonal drink) wait on the owner. Since batch 10.18 the daily job also moves them forward by itself.
- **Rehearsing the demo** out loud on the live site with `docs/DEMO-SCRIPT.md`, and reading the case study's "How I worked". This is the last check of batch 9.3.
- **On the live site:** an Event or Post photo (12.3), longer Posts, and tasting notes and drink links in the Menu Items.
- **On hold by the owner's choice:** real photos (2026-11-07), new features, and a PayMongo account (PayMongo paused sign-ups; revisit when they reopen, ADR 0003).

## 1. Timeline at a glance

The phases in order, with the estimated time of each. **MVP** (minimum viable product) is the first complete, usable version of the site. **V1** is the next version, with extra features. Phases 10 and 11 have no estimate, so they are not in the table: Phase 10 (the rest of the audit backlog) is done, and Phase 11 (handoff and the deep check) is next. Phases 0 to 10 are done, apart from the owner's last step in batch 5.4.

| Phase | What | Estimate | Releases |
| --- | --- | --- | --- |
| 0 | Foundation | 1 week | |
| 1 | Menu and cafe info | 1.5 weeks | |
| 2 | Cart, checkout, Pay at Pickup, Bar Screen | 2 weeks | |
| 3 | Online payments (Test Mode) | 1 week | |
| 4 | Members and Stars | 1 week | |
| 5 | Events, news, polish and demo deploy | 1.5 weeks | **MVP** |
| 6 | V1 features | 2 weeks | **V1** |
| 7 | Audit fixes | 1 week | |
| 8 | Improvements found by the audit | 2 weeks | |
| 9 | Portfolio review and case study | 0.5 week | |

## 2. Tech stack and where it is used

One row per job the site needs done: the tool chosen for it, the phase where it first appears and where the choice is recorded. The ADR links go to the decision notes in [adr/](adr/README.md). The list under the table says what each tool does.

| Layer | Choice | Phase | Decision |
| --- | --- | --- | --- |
| App | Next.js 16 (App Router, Cache Components), React 19, TypeScript | 0 | [ADR 0001](adr/0001-modular-monolith-nextjs.md) |
| Styling | Tailwind CSS 4, tokens in `globals.css`, native elements and CSS only | 0 | `docs/05-DESIGN-SYSTEM.md`, [ADR 0011](adr/0011-native-elements-and-css.md) |
| Data | PostgreSQL with Prisma; Docker locally, Neon (Singapore) when hosted | 0, 5 | [ADR 0004](adr/0004-postgres-prisma-neon.md) |
| Auth | Better Auth: email link, Google, Staff roles; our own Second Factor (TOTP) for Staff | 0, 4, 5 | [ADR 0005](adr/0005-better-auth-members-and-staff.md), [ADR 0014](adr/0014-staff-second-factor-in-identity.md) |
| Payments | `PaymentProvider` interface; `fake` and PayMongo (Test Mode only) | 3 | [ADR 0003](adr/0003-payments-paymongo-test-mode.md) |
| Email | Resend (terminal output until a key exists) | 2 | Roadmap batch 2.6 |
| Hosting | Vercel Hobby (deploys from GitHub), Vercel Blob for photos | 5 | Decided in batch 5.4 |
| Tests | Vitest (real test database), Playwright with axe, Lighthouse | 0 | `docs/03-ARCHITECTURE.md` section 15 |

What the names mean:

- **Next.js, React, TypeScript:** the toolkit and language the web pages are written in. Cache Components lets public pages be built ahead of time and refreshed when the menu or hours change.
- **Tailwind CSS:** the styling tool. Colours, fonts and spacing are defined once as tokens (named values) in `globals.css`.
- **PostgreSQL, Prisma, Docker, Neon:** PostgreSQL is the database. Prisma is the layer the code uses to talk to it. Docker runs a local copy of the database on a developer's PC. Neon is the company that hosts the online copy (in Singapore).
- **Better Auth, TOTP:** the sign-in library. TOTP is the 6-digit code that an authenticator app on a phone shows, used as the Staff Second Factor.
- **`PaymentProvider`, `fake`, PayMongo:** the code's single doorway to payments. `fake` is a built-in pretend provider. PayMongo is a Philippine payment company, used in Test Mode only (no real money).
- **Resend:** the service that sends emails.
- **Vercel, Vercel Blob:** Vercel hosts the site and deploys it from GitHub. Blob is its file storage, used for photos.
- **Vitest, Playwright, axe, Lighthouse:** Vitest runs the small automatic tests. Playwright clicks through the real site in a browser. axe checks accessibility. Lighthouse scores speed and quality.

## 3. How every batch is worked

The routine behind every batch. The aim is small changes that are tested, looked at and written down before they are merged.

1. Read the phase below and `CLAUDE.md`; pick the first unchecked batch; create its branch (a separate copy of the code, named `feature/<phase>.<batch>-<name>`).
2. Build. Money, Capacity, Prep Time, Stars, Order Status and webhook rules go test-first with the `tdd` skill (write the test, watch it fail, then write the code).
3. `npm run qa` must pass (it runs lint, the format check, the type check, the unit tests, a production build and a security audit of the libraries). Add `npm run test:e2e` (the browser tests) for anything visible. Look at the change in the browser at 375, 768 and 1280 px, in the Day and the Night palette.
4. Tick the batch here, update any document the change affected, add an ADR (a short decision note) if a decision was made.
5. Commit, push and open a pull request into `main` only when the user asks (Conventional Commits, a message style such as `feat(seed): ...`); the user merges it on GitHub with a merge commit.

## 4. Decisions along the way

Some choices were left open by the original plan. When one came up during a batch, the choice and its date were recorded here. Each row says when it came up, what the question was, what was chosen and where it is written down. `fake` is the built-in pretend payment provider, Xendit is another Philippine payment company, Resend sends email, Neon hosts the database and Vercel hosts the site.

| When | Decision | Outcome | Recorded in |
| --- | --- | --- | --- |
| Batch 1.1 | Build approach for the chosen direction (ADR 0010): Sample A (native and CSS) or Sample B (library parts) | Sample A, without building samples (2026-10-31) | [ADR 0011](adr/0011-native-elements-and-css.md) |
| Batch 1.2 | Menu photos: stock, own photos or AI-generated, and their labelling | AI-generated concept images, stand-ins until they are made (2026-10-31) | [ADR 0012](adr/0012-concept-images-with-stand-ins.md); `docs/ASSETS.md` |
| Batch 2.1 | Capacity and Prep Time defaults | 12 drinks and 8 food Lines per window; 4 minutes plus 1.5 per drink | Seed data; `docs/04-DATA-MODEL.md` section 5; `docs/03-ARCHITECTURE.md` section 9 |
| Batch 2.6 | Email sender domain (`MAIL_FROM`) and the footer's contact address | Resend's test sender and `hello@hoshikopi.example` until the owner has a domain | `docs/06-SETUP.md` section 5; batch 2.6; PRD section 2 |
| Batch 3.1 | PayMongo account, or `fake` for the MVP | `fake`; no account (2026-10-31) | ADR 0003 |
| Batch 3.4 (Nov 2026) | PayMongo paused new sign-ups: stay on `fake` or add a Xendit Test Mode adapter | Stay on `fake` (2026-11-07) | ADR 0003 update |
| Batch 4.1 | Star rules (1 per drink, 9 for a Reward) | Built as planned | PRD section 2 |
| Batch 5.4 | Hosting the demo | Vercel Hobby with Git deploys from GitHub and Neon for the database; live 2026-11-01 | `docs/06-SETUP.md` section 9 |
| Batch 5.4 (Nov 2026) | Resend needs a verified domain to reach anyone but the owner | Skip Resend until a domain exists; visitors sign in with Google (live 2026-11-07), and demo mode (8.1) later | `docs/06-SETUP.md` section 9 |

## 5. Phase 0: Foundation (1 week)

**In plain words:** this phase delivered the empty but real app: the project scaffold, the quality checks, the database with its seed data, the money and clock helpers, a sign-in skeleton for Staff, and the page layout with the Day and Night palettes.

Goal: an empty but real app with the database, auth skeleton, design tokens and quality gates in place.

- [x] **0.1 Scaffold.** Next.js into this folder; remove defaults; `AGENTS.md` block kept; `.env.example`; `npm run dev` works. Done 2026-10-31 with Next.js 16.4.3 and React 19.3; the scaffold already turns on `cacheComponents`.
- [x] **0.2 Quality gates.** ESLint (with the module-boundary import rule), Prettier, TypeScript strict, Vitest, Playwright with axe, the `qa`, `qa:full` and `test:e2e` scripts; one passing test of each kind. The type check runs `next typegen` first: `LayoutProps` and route types are generated. **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - Vitest 5 (needs `@types/node` 24), Playwright 1.64 at 375 and 1280 px
  - the unit test proves the boundary rule
  - `qa` audits production dependencies only (the 16 moderate advisories are in ESLint's dev-only `minimatch`).

  </details>
- [x] **0.3 Database.** Docker Postgres (section 6 of setup); Prisma schema for every table in `docs/04-DATA-MODEL.md`; first migration with the CHECK constraints; seed data; test database guard.
  <details><summary>How it was done</summary>

  - Done 2026-10-31 with Prisma 7.10.1 and `@prisma/adapter-pg`: every MVP table
  - the V1 tables (`inquiries`, `recurring_events`) wait for Phase 6 and `two_factors` for batch 0.5
  - the migration adds the CHECKs, allowed badge and allergen values, and a trigger that keeps `order_events` append-only
  - `payments.checkout_url` added for the redirect.

  </details>
- [x] **0.4 Modules and money.** `src/modules/*` folders with `index.ts`; `lib/money.ts` (centavos, formatting `PHP 165`); `lib/clock.ts` (Manila time, freezable in tests); tests first. **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  `formatPrice` (menu) and `formatReceipt`, `vatPart` (12/112, half up), `now()` with `freezeClock`, `manila()` and `manilaInstant()` on the fixed UTC+8 offset.

  </details>
- [x] **0.5 Auth skeleton.** Better Auth with email link (link printed to the terminal until Resend), Staff roles, `requireStaff`, `audit()`; seeded Manager and Barista can sign in to an empty `/manage`.
  <details><summary>How it was done</summary>

  - Done 2026-10-31 with Better Auth 1.7.10: links go to the terminal and `data/mail/` (the end-to-end tests read them there)
  - our Server Action limits links to 3 per email and 30 per IP every 15 minutes
  - Better Auth's own link-check limit is raised to 60 a minute per IP. Staff TOTP waits for batch 5.3.

  </details>
- [x] **0.6 Layout and tokens.** Fonts, colour tokens, header with Cart button, footer with the Concept Notice (linking to `/concept`), the neighbourhood and email but no phone or social links, Day and Night palettes switched by Manila time with an Auto, Day, Night switch (ADR 0010), security headers; the static `/concept` page (INFO-10); the site-wide share image (INFO-09). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - tokens in `globals.css` with `[data-theme="night"]`
  - the theme script re-checks the clock every minute
  - the phone menu is a native popover
  - security headers without the full CSP (batch 5.3)
  - share image drawn with `next/og` in Fraunces
  - the Day grain is a 3.7 kB tile (`docs/ASSETS.md`).

  </details>

**Exit criteria:** `npm run qa:full` green; a seeded Manager signs in and sees `/manage`; the home page shows the header, footer and Concept Notice at 375 and 1280 px with zero axe violations.

## 6. Phase 1: Menu and cafe info (1.5 weeks)

**In plain words:** this phase delivered the public menu pages, the cafe page and Home, and the Manager screens that edit the menu. Photos are stand-in panels until the concept images are made.

Goal: a beautiful, fast menu and cafe page that a Manager can edit.

- [x] **1.1 Design direction.** **Done 2026-10-31** (without the two samples).
  <details><summary>How it was done</summary>

  the owner asked for the site to be built straight through, so Sample A (native elements and CSS) was recorded as the approach ([ADR 0011](adr/0011-native-elements-and-css.md)); Sample B can still be asked for.

  </details>
- [x] **1.2 Photos and assets.** Menu photo decision (ADR); `docs/ASSETS.md`; stand-in photos for the seeded menu, each with alt text; 4 to 6 AI-generated room photos of one consistent room, captioned "Concept image" (PRD section 2). **Done 2026-10-31** (as slots).
  <details><summary>How it was done</summary>

  no image generator was available, so menu and room pictures are AI-generated concept images still to make, with stand-in panels until then ([ADR 0012](adr/0012-concept-images-with-stand-ins.md)); every seeded Menu Item has alt text and `docs/ASSETS.md` lists each slot with its prompt.

  </details>
- [x] **1.3 Menu pages.** `/menu` by Category, `/menu/item/[slug]` with Option Groups shown (not yet orderable), badges including Barista Pick, Sold Out and Hidden (MENU-01 to MENU-04); the allergen line (MENU-07); the pickup and Dine-in line (INFO-06); Menu Item share cards (INFO-09); prerendered with the `menu` cache tag. **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - `getMenu` and `getMenuItem` are `"use cache"` with the `menu` tag and an hourly lifetime, so Sold Out (compared with the Manila service day) turns over by itself after midnight
  - the Option picker shows the running price
  - ordering arrives in batch 2.2.

  </details>
- [x] **1.4 Cafe page and home.** `/cafe`: Opening Hours with Special Hours, "open now", map link, directions, the space, Amenities, the FAQ with ordering and Stars questions, story (INFO-01, INFO-04 to INFO-07); Day and Night hero copy (INFO-12); home in the order of `docs/05-DESIGN-SYSTEM.md` section 6: hero with Order ahead and Plan your visit, Barista picks this week, the printed-menu section, the space, visit block (INFO-08); `/manage/cafe` for the cafe's details and Amenities (STAFF-09); CafeOrCoffeeShop structured data (INFO-02, INFO-03). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - hours logic in `lib/hours.ts` (shared by the server and the "open now" island, tested)
  - the Home menu's List and Photos switch is two radios and CSS
  - dynamic routes read `params` inside Suspense, as Partial Prefetching needs
  - the Star Card, next Event and latest Post join Home in batches 4.3 and 5.1.

  </details>
- [x] **1.5 Manager: menu.** `/manage/menu`: Categories, Menu Items, Option Groups, Options, prices, photos (local files for now), Hidden, Sold Out; every save revalidates the `menu` tag (STAFF-03, STAFF-04). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - Baristas toggle Sold Out for Menu Items and Options
  - Managers edit Categories, Menu Items (photo upload to `public/menu/`, type checked by its first bytes), Option Groups and Options (one default per single-choice group)
  - every write is audited and calls `updateTag("menu")`
  - public reads now live one minute (docs/03 section 4).

  </details>

**Exit criteria:** a Manager changes a price and marks an item Sold Out, and the public menu shows both within seconds; mobile Lighthouse 90+ on `/menu`; zero axe violations.

## 7. Phase 2: Cart, checkout, Pay at Pickup, Bar Screen (2 weeks)

**In plain words:** this phase delivered ordering for pickup: the Cart, checkout with Pay at Pickup, the Order Status rules, the two emails, and the Bar Screen where a Barista moves an Order from new to Picked Up.

Goal: a Guest orders and pays at pickup; a Barista runs the Order to Picked Up.

- [x] **2.1 Hours, Capacity, Prep Time.** `cafe` module: `isOpen`, Pickup Windows, Capacity per weekday, Ordering Paused, Prep Time formula; Manager pages for hours, Special Hours, Capacity and pause (STAFF-05); tests first. **Done 2026-10-31** (test-first).
  <details><summary>How it was done</summary>

  - `getOrderingDay` (fresh read: hours with Special Hours, Capacity for the weekday, pause, Prep Time settings), `orderingState`, `prepMinutes` and `pickupWindows`, which takes the window counts as an argument because `pickup_window_usage` belongs to `ordering`
  - windows start once the Order can be ready and end by closing
  - `/manage/hours` for STAFF-05.

  </details>
- [x] **2.2 Cart.** Option picker becomes orderable; Cart with merge, edit and remove; Guest cookie; server pricing; Sold Out Lines flagged (ORD-01, ORD-02, ORD-06). **Done 2026-10-31** (test-first).
  <details><summary>How it was done</summary>

  - `menu.priceChoices` checks each choice against its Option Groups and Sold Out and prices it
  - the Cart stores choices only, merges identical ones by `choice_key`, and prices on every read
  - the Guest cookie holds a random token whose SHA-256 hash is stored
  - the header's Cart count streams inside Suspense.

  </details>
- [x] **2.3 Order Status machine.** `ordering` module: transitions table, `transition()`, `order_events`, Order Codes; every transition tested (section 7 of the architecture). **Done 2026-10-31** (test-first).
  <details><summary>How it was done</summary>

  - `transition()` locks the Order row (`FOR UPDATE`), checks the table by actor, sets the timestamps, gives back window counts on Cancelled and Expired only (so a Refund after a cancel never gives them back twice), and appends `order_events`
  - a refused move returns `not_allowed` or `reason_required` because a Customer cancel can race a Barista accept
  - `nextOrderCode` counts per service day with one upsert. Emails, Stars and payment Refunds join the side effects in batches 2.6, 4.2 and 3.5.

  </details>
- [x] **2.4 Checkout and placement.** Pickup Time picker (ASAP and Scheduled), contact details, Pay at Pickup; `placeOrder` with the window lock; closed and paused refusals; the 15-drink cap and the Guest limit for Pay at Pickup; the Last Order countdown on the hero card and at checkout (ORD-03 to ORD-05, ORD-07, ORD-12, ORD-13, PAY-02). **Done 2026-10-31** (test-first).
  <details><summary>How it was done</summary>

  - `placeOrder` runs in one transaction (pause and hours, server re-pricing against the total the Customer saw, the caps, a `FOR UPDATE` lock on the window's usage row, snapshot Lines, the Order Code, a 32-byte link token stored as its hash, then the Cart emptied)
  - checkout offers ASAP and today's windows with room
  - the Last Order countdown is a client island on the hero card and server text at checkout. Online Payment Methods wait for Phase 3. The end-to-end tests open the cafe all day with Special Hours, because the server reads the real clock.

  </details>
- [x] **2.5 Order status page.** `/orders/[id]` with the access token; polling; customer cancel before Accepted; the pickup and Dine-in line (ORD-08, ORD-09, INFO-06). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - `/api/orders/[id]/status?t=` answers the Order Status and a version in a few bytes
  - a client poller asks every 5 seconds (30 once Ready), pauses while the tab is hidden and refreshes the page on a change
  - the timeline marks the current step, Ready with the gold star
  - the Customer cancels until Accepted through `cancelByCustomer`.

  </details>
- [x] **2.6 Emails.** Resend (or terminal output): Order placed, Ready for pickup (ORD-10). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - plain-text Order placed (with the receipt, its VAT part and the status link) and Ready for pickup emails, sent after the transaction commits through Resend's REST API when `RESEND_API_KEY` is set, otherwise to the terminal and `data/mail/`
  - the status link token is now an HMAC of the Order id, so any later email can rebuild it. Decision (section 4): `MAIL_FROM` stays Resend's test sender and the contact address stays `hello@hoshikopi.example` until the owner has a domain
  - the Manager changes the address in `/manage/cafe`.

  </details>
- [x] **2.7 Bar Screen.** `/bar` with columns, polling, sound, one-tap steps, mark paid at the counter (STAFF-02); daily cron route and sweep-on-read for expiry. **Done 2026-10-31** (test-first).
  <details><summary>How it was done</summary>

  `barBoard` (today's live Orders by Pickup Time, unpaid online ones hidden, a version for cheap polls, Scheduled Orders under "Later today" until Pickup Time minus Prep Time) and `expireUnpaid` (on read in the bar, checkout and the Order page, and in `/api/cron/daily`, which checks `CRON_SECRET`); the Bar Screen keeps the Night palette, chimes with the Web Audio API (mute saved per tablet), pulses new cards once, and Managers pause, resume and cancel with a reason. The status page follows Picked Up within 30 seconds, as ADR 0009 says, not 5 as the exit criteria wrote.

  </details>

**Exit criteria:** in a Playwright run, a Guest orders two customized drinks for a Scheduled Pickup, a Barista moves the Order to Picked Up on `/bar`, and the status page follows every step within 5 seconds (Picked Up within 30, ADR 0009); a full Pickup Window is never offered. Met 2026-10-31 (`tests/e2e/bar.spec.ts`).

## 8. Phase 3: Online payments in Test Mode (1 week)

**In plain words:** this phase delivered online payment with no real money: the `fake` provider, payments confirmed only by verified webhooks (messages the provider's server sends ours), unpaid Orders that Expire after 15 minutes, and Refunds. The PayMongo account batch (3.4) was skipped.

Goal: GCash, Maya and Card work end to end without any real money.

- [x] **3.1 Provider interface and `fake`.** `PaymentProvider`, the `fake` adapter with `/dev/pay/[id]` and signed webhooks; production refusal (PAY-06). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - `PaymentProvider` with `fake` (HMAC-signed events, checkout at `/dev/pay/[id]`) and `paymongo` adapters
  - `providerFor(env)` refuses a PayMongo key without `sk_test_` and keeps `fake` off production domains (it runs on localhost and `*.vercel.app`). Decision (section 4): no PayMongo account yet, so the MVP runs on `fake`
  - the PayMongo adapter exists and is unit-tested but has not met a sandbox. The checkout page and webhook route arrive in batch 3.2.

  </details>
- [x] **3.2 Webhooks.** Signature check, `payment_events` dedupe, Order to `paid`; the return page reads the Order (PAY-03). **Done 2026-10-31** (test-first).
  <details><summary>How it was done</summary>

  - checkout offers GCash, Maya and Card (Test Mode) beside Pay at Pickup
  - online placement starts the provider checkout after commit
  - `/api/webhooks/[provider]` hands the raw body to `receivePaymentWebhook`, which verifies, records the event with `ON CONFLICT DO NOTHING` and moves the Order to Paid in one transaction, then emails
  - the fake checkout at `/dev/pay/[id]` posts a real signed webhook to that route
  - the Order page shows Finish paying or a failed payment.

  </details>
- [x] **3.3 Expiry.** Unpaid online Orders Expire after 15 minutes and release their window (PAY-04). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  `expireUnpaid` (on read and in the daily cron, batch 2.7) now also marks the Payment expired and closes the checkout at the provider, so a payment that arrives later is ignored.

  </details>
- [x] **3.4 PayMongo adapter.** Hosted checkout for GCash, Maya and Card with test keys only; the live-key guard (PAY-01). Skipped if the account decision says `fake` only. **Skipped 2026-10-31** (as the rule says).
  <details><summary>How it was done</summary>

  no PayMongo account yet, so the MVP runs on `fake`. The adapter from batch 3.1 is ready: create a PayMongo account, set `PAYMENT_PROVIDER=paymongo`, `PAYMONGO_SECRET_KEY=sk_test_...` and `PAYMONGO_WEBHOOK_SECRET`, point a webhook for `checkout_session.payment.paid` at `/api/webhooks/paymongo`, and run one test-card payment to confirm the shapes.

  </details>
- [x] **3.5 Refunds.** Manager full refund, email, Order to `refunded` (PAY-05, STAFF-07). **Done 2026-10-31** (test-first).
  <details><summary>How it was done</summary>

  - `refundOrder` claims the Payment (paid to refunded) before calling the provider so a double click refunds once, records the Refund and moves the Order to Refunded, then emails
  - Pay at Pickup is refunded in cash with no provider call
  - `cancelOrder` refunds a paid Order whoever cancels it (the system does it for a Customer, ORD-09)
  - `/manage/orders` shows a day's Orders and totals with Refund and Cancel behind a confirm.

  </details>

**Exit criteria:** with the `fake` provider (and PayMongo test cards if 3.4 ran), an online Order reaches `paid` only through a verified webhook, a replayed webhook changes nothing, an abandoned payment Expires and frees its window, and a refund completes.

## 9. Phase 4: Members and Stars (1 week)

**In plain words:** this phase delivered Member accounts, the Star ledger, the Star Card with a free drink at 9 Stars, and the privacy tools (notice, data export, account deletion).

Goal: regulars sign in, collect Stars and redeem a free drink.

- [x] **4.1 Member accounts.** Email link and Google sign-in; Guest Cart merges on sign-in; order history (ACC-01, ACC-02). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - a first email-link sign-in makes the Member
  - `currentCartOwner` is the Member once signed in and folds in any Guest Cart left in the browser (`mergeGuestCart`, tested)
  - checkout is prefilled and Members Pay at Pickup without the 4-drink limit
  - `/account` lists past Orders
  - Guests are offered an account after ordering
  - Google sign-in shows only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set (untested until keys exist). One-tap reorder is V1 (ORD-11).

  </details>
- [x] **4.2 Star ledger.** `loyalty` module: earn on Picked Up, reverse on Refund, adjust by Manager; balance as a sum (LOY-01, LOY-05); tests first. **Done 2026-10-31** (test-first).
  <details><summary>How it was done</summary>

  - `transition()` earns 1 Star per drink (Reward Lines excluded) on Picked Up and reverses them on a Refund after Picked Up, in the same transaction
  - a reverse never takes the balance below zero (Stars already spent stay spent)
  - Managers adjust with a reason at `/manage/stars`, with the Member row locked and an audit row. Also fixed: React 19 resets a form after its action, so checkout and the Stars form now keep what was typed after a refusal
  - the Manager editors still reset to saved values on an error (batch 5.2).

  </details>
- [x] **4.3 Star Card and Rewards.** `/account/stars`; redeem 9 Stars at checkout; release on Cancel or Expire (LOY-02, LOY-03). **Done 2026-10-31** (test-first).
  <details><summary>How it was done</summary>

  - a Reward makes one unit of the dearest drink free (its Base Price)
  - its Options still add their Price Delta, as docs/03 section 5 says. `placeOrder` locks the Member, checks 9 Stars before taking window room and reserves them in the same transaction (two tabs cannot both spend them)
  - the Reward Line earns no Star
  - Cancelled and Expired Orders release the 9. The Star Card is a nine-star constellation that draws a cup on `/account` and `/account/stars`, with the Star history.

  </details>
- [x] **4.4 Privacy.** Privacy notice page, marketing opt-in, data export and account deletion (ACC-03). **Done 2026-10-31** (test-first).
  <details><summary>How it was done</summary>

  - `/privacy` notice (Data Privacy Act rights, plainly)
  - Your details on `/account` with a separate marketing opt-in
  - `/api/account/export` downloads profile, Orders and Star history as JSON
  - Delete my account de-identifies the Member's Orders (kept for the cafe's records), forgets Stars and the Cart, and anonymises the user and every way back in.

  </details>

**Exit criteria:** a Member orders three drinks, the Order is Picked Up, the Star Card shows three more Stars; with nine Stars the Member redeems a free drink, cancels, and gets the Stars back. Met 2026-10-31 (`tests/e2e/stars.spec.ts`).

## 10. Phase 5: Events, news, polish and demo deploy (1.5 weeks)

**In plain words:** this phase delivered Events and Posts, the accessibility, speed and security passes, and the live demo on Vercel and Neon (live since 2026-11-01). Batch 5.4's last step, the first photo upload on the live site, was done by the owner on 2026-11-18.

Goal: the MVP is complete, fast, accessible and online as a demo.

- [x] **5.1 Events and Posts.** Public pages, Manager editors with Markdown preview, home sections, Event structured data, Event and Post share cards (EVT-01, NEWS-01, NEWS-02, STAFF-06, INFO-09). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - `content` module (plain reads for tests, `"use cache"` wrappers under the `content` tag, saves in Manila time with audit)
  - `/events` with past Events in a `details`, `/events/[slug]` with Event structured data, `/news` and `/news/[slug]`
  - share cards with the title and date or excerpt
  - Home gains the example Star Card, the next Event and the latest Post
  - `/manage/events` and `/manage/posts` with a live Markdown preview (no raw HTML). Photo upload for Events and Posts waits for Blob storage (batch 5.4).

  </details>
- [x] **5.2 Accessibility and speed pass.** Keyboard-only walkthrough, screen reader spot checks, Lighthouse budgets (`docs/05-DESIGN-SYSTEM.md` section 11), image weights. **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - `tests/e2e/quality.spec.ts` checks the JavaScript budget (under 170 kB compressed) on seven public pages, no sideways scrolling at 320 px on ten pages (WCAG 1.4.10; the header's Cart word is screen-reader-only under 360 px), and a keyboard-only path from the skip link through an Option Group to Add to order
  - Manager editors keep what was typed after a refused save (`useKeptForm`). Lighthouse mobile on this laptop (benchmark index about 1,100, so the default 4x CPU slowdown over-throttles): accessibility, best practices and SEO 100 on Home, menu and a Menu Item
  - LCP 1.0 to 1.4 s and CLS 0 meet the budget
  - Performance 86 to 92 and total blocking time 350 to 460 ms miss it. The blocking time is React hydration (the `react-dom` chunk), not app code
  - halving the RSC payload by turning off `partialPrefetching` did not move it, so the flag stays. Re-measure with PageSpeed Insights on the demo URL in 5.4. Bar poll with nothing changed is 13 bytes
  - the paper grain is 3.7 kB
  - menu photos are still stand-ins (ADR 0012), served as WebP at card size by `next/image`, so their weight is checked when the real photos land. Screen reader spot checks (NVDA, VoiceOver) need a person
  - axe covers names, roles and contrast on every page.

  </details>
- [x] **5.3 Security pass.** Headers and CSP, rate limits, Staff TOTP, a review of webhook and checkout code (`security-review` skill). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - a full Content-Security-Policy locked to this site
  - scripts need `'unsafe-inline'` because Next's inline RSC scripts on prerendered pages take no nonce or hash (tested: the theme-script hash alone stops hydration; ADR 0013). Rate limits on checkout tries (10 per Cart, 20 per IP, per 15 minutes) and webhooks (120 per IP a minute). Staff Second Factor (TOTP) once per session before `/manage`, checked by `requireStaff()` with our own `two_factors` table, a QR code and 10 tries per 15 minutes
  - Better Auth's plugin skips email-link sign-ins (ADR 0014). The Bar Screen stays exempt, except a Manager's cancel, which can refund. An independent review of the webhook, checkout, Order link and Second Factor code found: cancelling an unpaid online Order left its checkout payable (now closed, test first), the Bar cancel above, and the fake provider failing open in production without `NEXT_PUBLIC_SITE_URL` or `BETTER_AUTH_SECRET` (now refused). Also fixed: `/orders/[id]` read the clock while Next rendered its shell (`connection()` first). The `security-review` skill reviews a branch against `main`, which still lacks the unmerged batches, so the review ran on the named code instead.

  </details>
- [x] **5.4 Demo deploy.** Neon database, Vercel project, Blob for photos, `PAYMENT_PROVIDER` and email settings for the demo; deploy from GitHub (decision in section 4).
  <details><summary>How it was done</summary>

  - Prepared 2026-10-31: `vercel.json` (migrations before the build, the daily cron at 6:00 AM Manila), the step-by-step checklist in `docs/06-SETUP.md` section 9, and emails on Vercel without Resend are dropped instead of printing sign-in links to the logs, except the seeded demo accounts' links, which only the project's owner can read there (ADR 0005, audit DOC-10). Live since 2026-11-01 (Vercel Hobby, Neon, `fake` payments, the daily cron). Left on 2026-11-07: (1) **Blob**: the owner created the store `hoshikopi-photos` (Public) on 2026-11-07
  - Vercel set `BLOB_STORE_ID` and signs in with OIDC, not a token. `storeMenuPhoto` now `put`s photos to `menu/` in the store (tests first, the Blob client mocked at its boundary), keeps only `a-z0-9-` of the slug in the name, and tells the Manager when the store refuses
  - `next.config.ts` allows the store's host for `next/image`. Left: the first real upload on the live site (a Manager, after the deploy). (2) **PageSpeed**: checked 2026-11-07 with Lighthouse 13.5.0, mobile (the PageSpeed Insights API was over its daily quota): Home 76, `/menu` 77, Hoshi Latte 74 for Performance
  - LCP 3.3 to 3.9 s, total blocking time 330 to 490 ms and about 298 kB of JavaScript per page, all over the budgets in `docs/05-DESIGN-SYSTEM.md` section 11
  - CLS 0 to 0.04 and Accessibility, Best Practices and SEO 100 are within. Fixing it is batch 7.6. (3) **Resend** is skipped until a domain exists (section 4)
  - visitors sign in with Google instead (live 2026-11-07). Real photos are on hold. **Done 2026-11-18:** the owner uploaded 19 menu photos on the live site through `/manage`
  - they are in the Blob store's `menu/` folder and show on `/menu`.

  </details>

**Exit criteria:** every MVP requirement in the PRD is met and ticked; the demo URL works for the two-minute demo script (PRD section 8); `qa:full` green. Phases 6 to 11 went ahead while 5.4's last owner step, the first live photo upload, waited (owner decision, audit DOC-10); it was done on 2026-11-18.

## 11. Phase 6: V1 features (2 weeks)

**In plain words:** this phase delivered the V1 extras: Favourites and Order again, Event Sign-up with a seat cap, Promos and Seasonal Menu Items, Order-ready alerts, reports and the Birthday Treat, menu search, weekly Events and Inquiries, Pairings and Day and Night Barista Picks, and calorie estimates. Filipino language (6.5) was dropped.

- [x] **6.1 Favourites and reorder** (ORD-11). **Done 2026-10-31**.
  <details><summary>How it was done</summary>

  - Members save a Menu Item with its Options from its page (Guests are asked to sign in) and see them in `/account` priced today, with Add and Remove
  - each past Order has Order again, which puts its Lines back in the Cart through `addLine` (checked and priced today) and says how many were left out. Order Lines now keep their Option ids (`option_ids`) next to the snapshot
  - Favourites go with the Cart when an account is deleted.

  </details>
- [x] **6.2 Event sign-up with a cap** (EVT-02). **Done 2026-11-01** (tests first).
  <details><summary>How it was done</summary>

  - Events get optional Seats
  - the Event page shows seats left and a Sign-up form (name, email, 1 to 4 seats, paid at the door), counted under a row lock on the Event so two at once never oversell, one per email per Event, 10 per IP an hour, confirmed by email
  - the Manager sets Seats in the Event editor and sees the Sign-ups below it. Cancelling a Sign-up is by replying to the email for now.

  </details>
- [x] **6.3 Promos and seasonal Menu Items** (time-boxed price changes on Menu Items; `available_until`, MENU-06). **Done 2026-11-01** (tests first).
  <details><summary>How it was done</summary>

  - a Promo price with first and last Manila days replaces the Base Price in `priceChoices`, so the Cart, checkout and Order snapshots follow it and Price Deltas still add on top
  - the menu shows today's price with the regular one struck through and a "Promo until" badge
  - `available_until` hides a Seasonal Menu Item after its last day ("Until" badge before). The Manager sets both in the item editor
  - a demo Promo on Matcha Latte and a seasonal Calamansi Honey Soda are seeded.

  </details>
- [x] **6.4 "Order ready" alerts** (ORD-14). **Done 2026-11-01**.
  <details><summary>How it was done</summary>

  - the Order page chimes, vibrates, retitles the tab and shows a browser notification (through a minimal service worker, `public/sw.js`, which Android needs) when the Order turns Ready
  - "Notify me when it's ready" asks for permission and unlocks the sound
  - a hidden tab keeps checking every 15 seconds. The installable app (PWA) with push notifications to a locked phone moves after V1 (section 13).

  </details>
- [x] **6.5 Filipino language.** Dropped 2026-11-01 by the owner: the site stays English only.
- [x] **6.6 Reports and Birthday Treat** (STAFF-08, LOY-04); menu search and dietary filters (MENU-05); Popular this week (MENU-09). **Done 2026-11-01** (tests first for Stars).
  <details><summary>How it was done</summary>

  - `/manage/reports` for Managers (last 7 or 30 days: sales by Manila day from Picked Up Orders, average Order, top Menu Items, Stars earned, given as Birthday Treats, redeemed, taken back and adjusted, and Orders cancelled, expired or refunded)
  - the Birthday Treat adds 9 Stars once a year in the birthday month (Manila calendar), set in Your details, when the Member opens their account or checkout
  - Home shows Popular this week once 5 Orders this week had drinks, labelled as demo data
  - /menu has a search box and Vegan, No caffeine and Nut-free filters that hide cards on the prerendered page.

  </details>
- [x] **6.7 Recurring Events and Inquiries** (EVT-03, INFO-11); ORD-12 then points to the Inquiry form; add to calendar on Event pages (EVT-04). **Done 2026-11-01**.
  <details><summary>How it was done</summary>

  - a weekly list ("Every week") on `/events` and `/cafe`, edited at `/manage/events/weekly`
  - `/cafe/inquire` saves an Inquiry (5 per IP an hour), emails the cafe's contact address and lists it at `/manage/inquiries`, where the Manager marks it answered or closed
  - the Cart, checkout and cafe FAQ point big orders to the form
  - each Event page has Add to calendar (`/events/[slug]/calendar`, an iCalendar file). Inquiries live in the `content` module, not `cafe` as first planned.

  </details>
- [x] **6.8 Pairings and Day and Night Barista Picks** (MENU-08, INFO-13). **Done 2026-11-01**.
  <details><summary>How it was done</summary>

  - "Goes well with" on each Menu Item page adds the Pairing in one tap with the defaults its own page starts with (or links there when a required choice is Sold Out)
  - the Manager sets it in the item editor. Day picks (`barista_pick`) and Night picks (`night_pick`), at most three each
  - Home and the menu's star badge show the current palette's set by CSS, so pages stay prerendered. The migration widens the badge CHECK and sets the seeded pairings and Night picks on databases seeded earlier.

  </details>
- [x] **6.9 Calorie estimates** (MENU-10). **Done 2026-11-01**.
  <details><summary>How it was done</summary>

  - `menu_items.calorie_kcal` (invented for the seeded menu, set on databases seeded earlier by the migration)
  - the Menu Item page shows "About 260 kcal with the choices it starts with. A concept estimate."
  - the Manager edits it in the item editor. Estimates follow the default version only, not the chosen Options.

  </details>

**Exit criteria:** each V1 item works end to end with tests; budgets from Phase 5 still hold.

## 12. Phases 7 to 11: audit fixes, improvements, portfolio review, the rest of the backlog, handoff

These phases came after V1: the fixes and improvements from the November audit, the portfolio write-up, the rest of the backlog, and the handoff.

### Phase 7: Audit fixes (1 week)

**In plain words:** this phase fixed the serious problems the November audit found, in checkout, payments, security, the Bar Screen, keyboard focus, Prep Time, Manager inputs and automatic checks (CI). It also made the tests independent of each other and brought the pages inside the speed budget.

From the November audit (`docs/audit/`). Each fix starts with a test that reproduces the finding; a finding no test can reproduce is dropped and noted in the audit.

- [x] **7.1 Checkout and Cart.** One Order per Place order press, even on a double tap, a retry or a second tab (an idempotency key on `placeOrder`); signing in with a Guest Cart no longer crashes the first page (the Guest Cart merges once); checkout keeps the chosen Pickup Time and Payment Method after a validation error. **Done 2026-11-07** (tests first).
  <details><summary>How it was done</summary>

  - `placeOrder` locks the Cart row before reading it (`lockCart` in the cart module), so the second of two Place orders finds the Cart empty and gets `cart_problem`
  - `mergeGuestCart` locks the Guest Cart first and `currentCartOwner` runs once per request (React `cache`)
  - the checkout action returns the Pickup Time and Payment Method with the typed values, and the form checks them again. Tests: two `placeOrder` and two `mergeGuestCart` calls at once (db), and a refused checkout keeping both choices (e2e).

  </details>
- [x] **7.2 Payments.** A paid webhook for an Order already Expired or Cancelled is recorded and refunded or shown to the Manager, never dropped; Payment status changes are guarded so `paid` can never be overwritten by `expired`. **Done 2026-11-07** (tests first).
  <details><summary>How it was done</summary>

  - `recordPaymentEvent` locks the Payment row and accepts a paid event unless the Payment is already paid or refunded, so a retry after a failed attempt pays the Order and a second paid event keeps the first payment id
  - a payment that lands after the Order Expired or was Cancelled is refunded in full after the commit (`refunded_late`, a Refund row with actor `webhook`)
  - `closeCheckout` marks the Payment expired only after the provider confirms, with a guarded update.

  </details>
- [x] **7.3 Security and deploy.** An Event Sign-up email can no longer become a file path in the mail outbox; Better Auth to the latest 1.7.x security release; Preview builds stop running `prisma migrate deploy` on the production database. **Done 2026-11-07** (tests first for the outbox).
  <details><summary>How it was done</summary>

  - the mail outbox keeps only letters, digits and `@._+-` of an address in the file name, so nothing lands outside `data/mail`
  - Better Auth 1.7.10 to 1.7.18 (with `@better-auth/utils` 0.5.1)
  - `vercel.json` migrates on Production builds only. Preview databases of their own (a Neon branch per preview) are the owner's switch in the Neon integration (`docs/06-SETUP.md` section 9).

  </details>
- [x] **7.4 Bar Screen.** The board keeps updating, or says it stopped, when its session ends; Scheduled Orders move to New on time without another Order changing. **Done 2026-11-07** (tests first).
  <details><summary>How it was done</summary>

  `barBoard`'s version adds the Prep Time and the count of make-next Orders; `/api/bar` answers 401 JSON when signed out (`currentStaff` in the identity module, no redirect), and the Bar Screen stops polling and shows "You're signed out, so the board stopped updating. Sign in again".

  </details>
- [x] **7.5 Finish the audit.** Review the 7 areas left (accessibility, architecture and code quality, tests, ops and deploy readiness, Staff tools, customer journeys, motion), double-check every finding (full run, owner's choice 2026-11-07) and rank them into `docs/audit/2026-11-XX.md`; findings fixed in 7.1 to 7.4 are marked fixed.
  <details><summary>How it was done</summary>

  - New P0 and P1 findings become batches 7.7 onward. The full Playwright run is flaky because specs share seeded data (a different Staff test fails each run), so the tests review should fix the shared state (`manage-hours.spec` pauses ordering for everyone, and `manage-menu.spec` changes the Spanish Latte price while `order-status.spec` orders it; `data/mail` is never emptied, so old sign-in emails pile up). Progress 2026-11-13: all 16 areas reviewed
  - every one of the 371 findings double-checked by a second reviewer and merged into 205 open items in `docs/audit/2026-11-13.md` (2 P0, 18 P1, 142 P2, 43 P3; 48 fixed, 16 out of scope, 1 refuted). Left: the shared-state fix above (backlog items tests:4 and tests:5), split into 7.5a and 7.5b. **7.5a test isolation, done 2026-11-14:** the 5 tests that change what every test sees (pause, Special Hours, Busy Mode, a price, Sold Out) are tagged `@cafe-wide` and run in their own Playwright project after phone and desktop, one at a time, with pause and Busy Mode cleared after each
  - the ORD-08 test hands its Preparing Order over so the Prep Time queue stays empty
  - the Phase 2 test takes the second Pickup Window, clear of Prep Time. The first verification runs found three more flakes, also fixed: the sign-in helper read every file in `data/mail` (now only the address's files), raced the page's own redirect to the Second Factor (now waits for it, or for not-found), and Place order sometimes took over 5 s under 4 workers (`expect` now waits 10 s). Failures keep a trace and screenshot. Full run: 180 passed, 33 skipped, 0 failed. **7.5b test mail and clock, done 2026-11-14:** emails go to `MAIL_DIR` when set (`outbox.ts`)
  - Vitest writes to `data/mail-test` and Playwright to `data/mail-e2e`, each emptied at the start of a run, so the developer's `data/mail` is untouched (2,234 files before and after a full Vitest and three Playwright runs). Tests read mail through one helper (`tests/e2e/mail.ts`) that opens only the address's files
  - the ORD-10 "Order placed" check uses an address of its own
  - the 8.3 Pickup Time test picks the last time offered and skips with a reason when none is left
  - the `db.ts` comment gives the real late-evening limit (about 23:20 Manila). Found and fixed on the way: the Event Sign-up test read `data/mail` itself, the sign-in helper returned before the page had its `<title>` (an axe check then saw none), and the 11th-try test waited for any POST instead of its own Server Action. Full runs: 180 passed, 33 skipped, 0 failed (twice in a row, then once more after the last fix). Vitest 228 of 228.

  </details>
- [x] **7.6 Performance budget.** Bring Home, `/menu` and a Menu Item to the budgets in `docs/05-DESIGN-SYSTEM.md` section 11 (Performance 90+, LCP under 2.5 s, total blocking time under 200 ms, JavaScript under 170 kB): measured 74 to 77, 3.3 to 3.9 s, 330 to 490 ms and about 298 kB on 2026-11-07 (5.4).
  <details><summary>How it was done</summary>

  - Starts after 7.5, so the audit's performance findings (the full Fraunces font, repeated session reads) shape it. Done 2026-11-08, pulled ahead of 7.5 at the owner's request: `partialPrefetching` off (each page carried its React payload twice; Home 50 to 34 kB compressed, `/menu` 34 to 23, a Menu Item 26 to 18)
  - Phosphor icons out of the browser bundle (the client links imported `nav-links.ts` with its icons, and the theme switch and option picker drew theirs on the client: now `nav-classes.ts`, and the icons come rendered from the server)
  - Suspense boundaries around the footer and the option picker, so hydration runs in shorter tasks
  - the Courier accent font no longer preloaded. Local production build, Lighthouse 12.8.2 mobile, 3 runs, medians: Performance 93, 93 and 94, total blocking time 113, 124 and 122 ms, CLS 0.002 at most, first-load JS 154 to 156 kB. Local LCP stays about 2.9 s because on localhost the scripts arrive before the first paint and Lighthouse's simulation charges them to it
  - the live site measured 1.7 to 2.5 s before these changes, so LCP is judged there. Tried and dropped: `inlineCss` (it also copies the stylesheet into the React payload: Home grew to 68 kB). Kept: Home's List and Photos views (the hidden photo copy of the menu), a designed feature.

  </details>
- [x] **7.7 Demo readiness.** The two P0 items and the demo's copy: the two-minute demo is closed outside Manila ordering hours (journeys:1; Demo Mode opens ordering all day, an ADR 0015 update); the public menu crashes when a Category slug has no stand-in icon (architecture:1); the demo says emails were sent when they are dropped (journeys:9); the seeded Events, Promo and seasonal dates are running out (ops:8).
  <details><summary>How it was done</summary>

  - Items and fixes in `docs/audit/2026-11-13.md`. Split into 7.7a, 7.7b and 7.7c. **7.7a menu crash, done 2026-11-14 (tests first):** `Photo` picks its stand-in icon through `iconFor`, which falls back to the fork and knife for any Category slug without its own icon, "constructor" included, so a Manager's new Category no longer crashes the public menu
  - the five `as PhotoKind` casts and the two `/manage/menu` guards are gone. Two CLAUDE.md rule breaks fixed with it: the Event page's structured-data price goes through the new `formatDecimal` in `money.ts` instead of `toFixed(2)`, and Add to order's "Added" restarts on a counter from the previous state instead of `Date.now()` (tests:17, architecture:15 and 16). Tests: `src/components/photo.test.ts` (an unknown slug and "constructor" render), `formatDecimal` in `money.test.ts`. **7.7b demo open all day, done 2026-11-14 (tests first):** the hosted demo takes Orders all day (ADR 0015 update, audit P0 journeys:1). `demoAllDayOrdering()` in the `payments` module is true for a production build where Demo Mode runs (the live demo, previews, the local e2e build) and false in local development and tests
  - the `ordering` module's new `orderingDay()` then gives checkout, placement, the Cart and the Bar Screen 00:00 to 23:45. Pause, Busy Mode, Capacity and Prep Time still apply, and the Visit page keeps the real hours
  - checkout says "This demo takes orders any time of day" and links them. Tests: an Order at 10 PM Manila on the hosted demo is placed while Pause still refuses (`place-order.test.ts`), the switch's cases (`provider.test.ts`), and the note at checkout (`checkout.spec.ts`). Ordering ahead for tomorrow (ORD-09) stays out of scope. **7.7c demo copy and dates, done 2026-11-14:** the live demo no longer says it sent emails it dropped (journeys:9). `canEmail()` in `notify` is false on Vercel without a Resend key
  - there `/sign-in` points to Google and refuses an email link for any address but the seeded demo accounts (whose links still reach the owner's Vercel logs), a Guest's Event Sign-up is confirmed on the spot (the per-visitor limit of 8.7 still applies) with copy that promises no email, and `/concept` says the demo sends no emails. The Day hero copy no longer says "morning" (it showed all afternoon, and all day with Day pinned; UI1-15), and the seed's Latte art night says twelve seats, as it has, and the open mic ends at the 9 PM close (UI1-18). Seeded dates on the live demo (ops:8) need no code: the Manager adds Events with Seats and moves the Promo and seasonal dates in `/manage` before the Phase 9 review (owner).

  </details>
- [x] **7.8 Keyboard focus and reduced motion.** Focus hidden under the sticky Category tabs and Add to order bar (a11y:1), lost when the Cart drawer or phone menu opens (a11y:2), after a client navigation (a11y:3) and on sign-in and Event Sign-up errors (a11y:4); the reduced-motion rule's cost on a Day and Night switch (motion:1) and no "Added" confirmation under reduced motion (motion:2).
  <details><summary>How it was done</summary>

  Split into 7.8a and 7.8b. **7.8a Keyboard focus, done 2026-11-14:** `scroll-padding` on the root keeps focus clear of the sticky Category tabs, the floating Cart and the phone Add to order bar (a11y:1). `DrawerFocus` moves focus to a drawer's Close button when it opens (the Cart pill hides behind an open drawer, so focus had dropped to `<body>`), closes the drawer when focus lands outside it, and Esc returns focus to the pill (a11y:2). `FocusOnNavigate` focuses the new page's h1 after a client navigation, waiting for it while it streams in, since Next keeps the old page hidden in the DOM (a11y:3). `useFocusInvalid` (shared by checkout, the Inquiry form, sign-in and Event Sign-up) focuses the first field to fix after a refusal (a11y:4). Tests: `tests/e2e/keyboard.spec.ts`, each failing before the fix. **7.8b Reduced motion, done 2026-11-14:** under `prefers-reduced-motion: reduce` transitions are `0s` instead of `0.01ms`, so a Day and Night switch starts no transitions (it started 645 on `/menu`, about 1 to 3 s of style work on a phone) (motion:1), and the "Added" on Add to order holds still at full opacity for 1.6 s (a `hold` keyframe) instead of jumping to its invisible last frame (motion:2). Animations elsewhere are unchanged, with motion on or off. Tests: two in `tests/e2e/quality.spec.ts`, both failing before the fix.

  </details>
- [x] **7.9 Prep Time and Pickup Times.** Prep Time counts Orders not yet accepted and the Order's own drinks, as the Glossary defines it (journeys:2), with the test that would have caught it (tests:1); a 13 to 15 drink Cart gets a Pickup Time (journeys:3).
  <details><summary>How it was done</summary>

  - Split into 7.9a and 7.9b. **7.9a Prep Time, done 2026-11-14 (tests first):** Prep Time counts the drinks the bar is making and the As Soon As Possible Orders waiting on the Bar Screen (Paid, or Placed Pay at Pickup), not Scheduled Orders still waiting for their time, plus the Order's own drinks beyond the first (ADR 0007 update; `docs/03` section 9). A single drink on an empty bar still takes 5 minutes
  - a 9-drink Order now gets 20. The Bar Screen's make-next keeps the queue without the new Order, and "N drinks ahead" on the Order page shares the on-the-bar rule (`ON_BAR`). Checkout shows one time for ASAP, "Ready by 9:30 AM" (journeys:10). Tests in `place-order.test.ts`: waiting Pay at Pickup drinks count, a Ready Order stops counting, a waiting Scheduled Order does not count, and the Order's own drinks count. **7.9b big Carts, done 2026-11-14 (tests first):** an Order is made in one Pickup Window, so `orderLimit()` caps it at that window's Capacity (12 drinks and 8 food Lines in the seed) and never over 15 drinks (journeys:3, ORD-04). `placeOrder` refuses a bigger Cart as `too_big` with the limit, instead of finding no window
  - checkout and the Cart page show one note, "One order fits one Pickup Window: up to 12 drinks and 8 food items", with the Inquiry link, instead of "No Pickup Times are left today"
  - the drawer stops offering Check out past 15 drinks
  - `/cafe` and the Inquiry page say "about a dozen drinks" instead of promising 15. Tests in `place-order.test.ts`: 13 drinks and 9 food Lines are refused with the limit, 12 drinks fit.

  </details>
- [x] **7.10 Bar Screen and Manager inputs.** The Manager's Pause, Busy and Cancel on the Bar Screen ask for the Second Factor instead of dropping the tap (staff:1); Bar Screen cards show the amount to collect and a free Reward (journeys:7); blank Hours, Capacity and map inputs are refused instead of saved as 0 (staff:5).
  <details><summary>How it was done</summary>

  Split into 7.10a and 7.10b. **7.10a Bar Screen controls, done 2026-11-14:** the Bar Screen shows a Manager's Pause, Busy Mode and Cancel only once this session has entered the Second Factor (`secondFactorEntered()` in identity); until then the header links to `/manage/two-factor?next=/bar`, which now returns to the Bar Screen. Cards show "Pay at Pickup: collect PHP 450" from `BarOrder.totalCents` and a "Reward" tag on a Reward Line (its Base Price is free, its Options are not, so the tag says Reward rather than "Free"). Tests: `tests/db/bar.test.ts` (total and Reward flag), `tests/e2e/bar.spec.ts` (a Manager without the Second Factor; the amount on the Phase 2 card). **7.10b Manager inputs, done 2026-11-14:** on `/manage/hours` and `/manage/cafe` a blank Capacity cell, Prep Time or map pin is refused instead of saved as 0 (`z.coerce` turned "" into 0), and those inputs are `required`. Prep Time finer than a tenth of a minute is refused rather than rounded by its `Decimal(4, 1)` column, and Special Hours for a day already gone are refused. Tests: `tests/db/cafe-admin.test.ts`.

  </details>
- [x] **7.11 CI and alerts.** One GitHub Actions job with a Postgres service runs lint, format, type check, Vitest and audit (tests:11, ops:4); money failures that need a person (a refund that fails) reach the owner, not only the logs (ops:1).
  <details><summary>How it was done</summary>

  Split into 7.11a and 7.11b. **7.11a CI, done 2026-11-14:** `.github/workflows/ci.yml` runs on every pull request and on `main`: `npm ci`, lint, Prettier, the type check, Vitest against a Postgres 17 service (throwaway env values; `.env.test` stays git-ignored), and `npm audit --omit=dev --audit-level=high` (high and critical only, so a new low advisory never blocks an unrelated pull request). Playwright and `next build` stay local: the build prerenders against a seeded database and the e2e suite depends on the Manila clock. `.github/dependabot.yml` opens grouped weekly pull requests for npm (minor and patch together) and GitHub Actions. `docs/06-SETUP.md` section 8 says how to read the checks. **7.11b Money that needs a person, done 2026-11-14:** an Order Expired or Cancelled whose Payment is still `paid` (paid after it closed, or its automatic Refund failed) is listed as "Needs a refund" at the top of `/manage/orders` for any day, and `refundOrder` now accepts it from a Manager, so "refund by hand" is a button; a late-paid Order keeps its Order Status, since it was never Paid in its own record. `src/instrumentation.ts` prints every server error as one JSON line (no query string: Order links carry their token). No uptime ping: nothing here needs one yet. Tests: `tests/db/refunds.test.ts`.

  </details>
- [x] **7.12 P2 sweep, done 2026-11-14.** Ten small P2 fixes from the ranked backlog (`docs/audit/2026-11-13.md`), one commit each: the checkout Stars line says the free drink earns none (journeys:4); a collected Pay at Pickup Order says "Paid at the counter." and a free one "Nothing to pay" (journeys:12); long names and emails get plain messages and `maxLength` (journeys:15); Sign-up and Inquiry emails use `z.email` and the Manager's mailto links are encoded (SEC2-01); the Better Auth routes the site never uses answer 404 (ID2-04); a refused cancel says why (staff:7); a Pay at Pickup refund says to give the cash back (staff:18); the Star Card reads right with more than one free drink (UI2-18); the hero heading is balanced (UI2-15); the Bar Screen chimes through one AudioContext (motion:6).
  <details><summary>How it was done</summary>

  The other P2 and P3 items stay in the backlog for after V1.

  </details>

**Exit criteria:** every 7.1 to 7.4 finding has a test that failed before the fix and passes after; the ranked audit backlog exists.

### Phase 8: Improvements found by the audit (2 weeks)

**In plain words:** this phase added what the audit suggested, such as Demo Mode (a visitor can play the barista), error pages, the phone experience, Busy Mode, Staff management and Event Sign-up protection. It also added the motion pass and page polish that the owner asked for.

Starts after Phase 7. Requirement IDs are added to the PRD when each batch starts.

- [x] **8.1 Demo mode for visitors.** A reviewer who opens the link alone can try the Bar Screen and watch an Order move, on demo data and without an email (PRD section 8, success metric 4). **Done 2026-11-08** (audit FEAT-01, ADR 0015; tests first).
  <details><summary>How it was done</summary>

  Demo Mode is on exactly when the fake payment provider runs (locally and on `*.vercel.app`). The Order page shows "Be the barista" with the bar's next step for that Order (Accept the order, Start making it, Mark it Ready, Hand it over); `advanceInDemo` checks the link token and calls `transition()` as the new `demo` actor (migration `demo_actor`), allowed only the four bar steps, so the page follows live, chimes at Ready, and a Member's Star lands at Hand it over. The concept page has "Try it in two minutes". The real Bar Screen stays Staff-only (ADR 0005): the case study will show it.

  </details>
- [x] **8.2 What the docs promise.** Error pages with the site shell and the Concept Notice (`error.tsx`, `global-error.tsx`, the root 404); `noindex` on public pages (ADR 0006); the floating Cart pill and drawer (`docs/05-DESIGN-SYSTEM.md`); Fraunces loaded as the one style used (400 italic).
  <details><summary>How it was done</summary>

  Done 2026-11-08 (audit SEC1-05, UI1-14, UI2-10, DOC-02, UI1-04, UI2-04, PERF-06): `error.tsx` for the site, `/manage` and `/bar` (one `ErrorPanel`: Try again with `retry()`, a way on, the error code) and `global-error.tsx` with its own document, palette and Concept Notice; an unknown address gets the customer header and footer, and missing pages inside the site or `/manage` get a 404 inside their own frame. The root metadata says `noindex, nofollow` (no robots.txt block, so crawlers can see it). The floating Cart pill and drawer are a native `popover`, as the phone menu is. Fraunces loads static 400 italic.

  </details>
- [x] **8.3 Phone experience.** A sticky Add to order bar on Menu Item pages, sticky Category tabs on `/menu`, and a Pickup Time chooser in place of 42 chips. **Done 2026-11-08** (audit UI1-05, UI2-03, UI1-13, UI2-08).
  <details><summary>How it was done</summary>

  - below 768 px the running price, quantity and Add to order stick to the bottom of the screen (a direct child of the form, CSS only; the floating Cart pill steps aside there)
  - the Category tabs stick to the top on `/menu` and each Category page
  - checkout shows the next 6 Pickup Times as even chips and the rest under "Later today" in a native `select` grouped by hour (the action reads `pickupLater` when "Later today" is chosen, and a refused checkout keeps it).

  </details>
- [x] **8.4 Busy Mode.** The Manager adds minutes to Prep Time during a rush, so "ready in 8 minutes" stays true. **Done 2026-11-08** (audit FEAT-02; tests first).
  <details><summary>How it was done</summary>

  - on the Bar Screen, next to Pause ordering, a Manager taps "Busy +10 min, 30 min" or "Busy +15 min, 1 hour" (`cafe_settings.busy_minutes` and `busy_until`, migration `busy_mode`, audited `cafe.busy.start` and `cafe.busy.end`)
  - it ends by itself or with End Busy Mode. `prepMinutes` adds the minutes before rounding, so the As Soon As Possible time, the first Pickup Window and the Bar Screen's make-next all follow
  - the board shows "Busy Mode: Prep Time +15 min until 10:45 AM" and checkout says the bar is extra busy. Not done here: the per-Order "Running late" tap the audit also suggests.

  </details>
- [x] **8.5 Staff management.** Give Staff roles by email, change or take them away, and end their sessions from `/manage`, not SQL (no invite: ADR 0005 update).
  <details><summary>How it was done</summary>

  - Done 2026-11-07, pulled forward (tests first, STAFF-10): `/manage/staff` for Managers lists the team and gives a role by email (Barista, Manager, back to Member)
  - `setRole` locks every Manager row and needs the actor to still be a Manager, so the last Manager stays even when two demote each other at once
  - losing a role ends the person's sessions
  - "Sign out everywhere" ends them on request
  - both are in the audit log (`identity.role.update`, `identity.sessions.end`).

  </details>
- [x] **8.6 Order page handoff.** Directions and hours, a calendar file for Scheduled Pickups, and how many drinks are ahead. **Done 2026-11-08** (audit FEAT-10 and FEAT-03).
  <details><summary>How it was done</summary>

  - a "Picking up" Panel on the Order page while the Order is still to collect (Directions, today's open status, the code to show, Add to calendar for a Scheduled Pickup)
  - "N drinks ahead of yours" for an As Soon As Possible Order on the bar, counted in Bar Screen order (Pickup Time, then placing time) by `drinksAhead` and part of the version the page polls, so it updates live (tests first)
  - `/orders/[id]/calendar` serves the calendar file with the link token. The calendar builder moved to `src/lib/calendar.ts` for Events and Orders and now escapes a lone CR, drops control characters and folds by bytes (audit SEC1-22, SEC2-14). Closed Orders say "Nothing to pay." or "Refunded in full" instead of "Pay at the counter".

  </details>
- [x] **8.7 Event Sign-up protection.** Confirm Sign-ups by email, limit them per visitor, and give each a cancel link, so one visitor cannot book out an Event. **Done 2026-11-08** (audit SEC1-06, SEC2-02; tests first).
  <details><summary>How it was done</summary>

  a Sign-up waits for its email link and holds its Seats for 30 minutes (`event_signups.confirmed_at`, migration `signup_confirmation`, older Sign-ups backfilled as confirmed). The link opens `/events/[slug]/signup/[id]`, where buttons confirm or cancel (a button, not the link itself, so mail scanners that open links can't confirm). Seats count only confirmed or still-held Sign-ups, on the Event page, at sign-up and for the Manager, who sees "Waiting for the email link". A signed-in Member who signs up with their own account email is confirmed at once (their email is proven by the sign-in link or Google), which keeps Sign-ups working on the demo while Resend waits for a domain; their email only carries the cancel link. A visitor gets 2 Sign-ups that went through per Event a day (a third is undone), on top of 10 tries an hour. The email no longer carries the name the visitor typed. Not done here: a Manager action to remove a Sign-up (SEC2-02 suggests one).

  </details>
- [x] **8.8 Database driver warning.** Stop overlapping queries on one `pg` client before `pg@9` removes them (the warning in the Vitest output). **Done 2026-11-08**.
  <details><summary>How it was done</summary>

  the warning came from `getOrderingDay` running its four reads with `Promise.all` on a transaction client inside `placeOrder` (a transaction is one connection). It now reads in sequence inside a transaction and in parallel on the pool; every other `Promise.all` uses `db`. The Vitest suite went from 10 warnings to 0.

  </details>
- [x] **8.9 Motion pass.** The owner found the site too still, with almost no transitions.
  <details><summary>How it was done</summary>

  - Done 2026-11-07, pulled forward: motion on every state change, CSS and the platform only, no new library (`docs/05-DESIGN-SYSTEM.md` section 7 has the new rules). Pages fade into each other through React's `<ViewTransition>` in `(site)/template.tsx` (re-exported by the menu, menu item, events, news and cafe folders), and only navigation animates
  - press feedback on every button, pill link and chip
  - Menu Item, Event and Post cards lift on hover or focus and rise in on scroll (CSS scroll timelines behind `@supports`)
  - the phone menu slides in and out (`@starting-style`)
  - disclosures fade their answer in
  - Day and Night crossfade
  - Add to order shows "Added" on the button and the Cart count bumps (`CartCount`, the only new client code)
  - the Star Card lights its Stars one by one
  - the Order page's marks pop in step order and Ready spins in its gold star with a ring
  - new Orders slide onto the Bar Screen in place of the 4 second blink. Transform and opacity only, so CLS stays 0
  - the hero stays still for its LCP (7.6)
  - checkout and Options stay quiet apart from press feedback. `prefers-reduced-motion: reduce` turns it all off, and Playwright now runs that way so axe checks settled pages. Dropped: the Pickup Time ring to star at checkout (checkout stays steady, 8.3 replaces the chips).

  </details>
- [x] **8.10 Page polish.** The owner asked for an easy way back on every page, no dead ends after an action, a little more flavour on each page, and the whole screen used on wide monitors.
  <details><summary>How it was done</summary>

  Done 2026-11-07, pulled forward. Every page now uses one container, `page-width` (96rem with 16, 24 and 32 px gutters), and grids add columns as the screen grows, up to 5 Menu Item cards; focus pages (Cart, checkout, the Order page, sign-in) keep a narrower column that starts at the logo like the rest. Reading text stays near 65 characters through a new `max-w-measure` token (34em), since `max-w-prose` ran about 100 characters in Plus Jakarta Sans (`docs/05-DESIGN-SYSTEM.md` sections 4 and 5). The shared BackLink, Breadcrumb, PageHeader, Panel, Empty, IconCircle, Pill and OrderStatusPill live in `src/components`. Every page below the top level has a back link or breadcrumb, and the header marks the current section. Each action ends on a next step: the Cart, checkout, the Order page, sign-in and sign-out, an inquiry, an Event Sign-up, new staff records, refunds, Stars adjustments, staff sessions and inquiries. Pages gain warm empty states, icon panels and status pills across the site and Manage, plus a richer footer and phone menu. Stars in the nav opens `/account/stars`, which Guests can now see. `/manage/hours` shows the Prep Time example from the cafe module's `prepMinutes`, so it rounds up to 5 minutes as customers see it. Native elements and CSS only (ADR 0011). Dropped: Cart photos, a Guest Order again, a confirm on Cancel order, and the Bar Screen Second Factor redirect, a bug listed for its own fix.

  </details>

### Phase 9: Portfolio review and case study (0.5 week)

**In plain words:** this phase wrote up the project: measured results in [`docs/METRICS.md`](METRICS.md), the case study in [`docs/CASE-STUDY.md`](CASE-STUDY.md) with screenshots, and a final review with an accessibility statement and a demo script.

- [x] **9.1 Measure.** The success metrics in PRD section 8, written up with numbers.
  <details><summary>How it was done</summary>

  - Done 2026-11-14 in [`docs/METRICS.md`](METRICS.md): a throttled phone orders and pays in 8.7 to 9.1 s (target 60, now a test)
  - Lighthouse mobile medians Home 89, `/menu` 91, a Menu Item 91, accessibility 100 (local build; Home 1 point short, live numbers to take at pagespeed.web.dev since the API quota refused)
  - 0 axe violations
  - 7 of 7 rule mutations caught, after the one miss (Preparing straight to Picked Up) got a test.

  </details>
- [x] **9.2 Case study.** `docs/CASE-STUDY.md`: the problem, the decisions (ADRs), screenshots, what I would do next. **Done 2026-11-14**.
  <details><summary>How it was done</summary>

  [`docs/CASE-STUDY.md`](CASE-STUDY.md) with seven screenshots in `docs/screenshots/` (Home in both palettes at 1280 px; the menu, a Menu Item, checkout and an Order page at 375 px; the Bar Screen), taken from a local production build with reduced motion.

  </details>
- [x] **9.3 Final review.** Code review, accessibility statement, README screenshots, demo script rehearsed. **Done 2026-11-14**.
  <details><summary>How it was done</summary>

  - `/accessibility` states the target (WCAG 2.2 AA in both palettes), how it is checked and the four known gaps from the backlog, linked from the footer and axe-checked
  - `docs/DEMO-SCRIPT.md` is the two-minute demo with what to do, what to say and what to do if it goes wrong, every step a passing e2e test (the spoken run on the live site is the owner's last check)
  - the README shows the status, four screenshots and links to the case study, metrics and demo script
  - the concept page links the case study. A medium code review of the 7.8b to 9.3 branch found 10 items: 6 fixed (a cash refund shown as a Test Mode refund, a PHP 0 refund offered, an unhandled `audio.resume()` rejection, two serial reads, the auth test covering 3 of 25 routes, no stack in the error line), 4 left as low impact (the cash message chosen by a form field, one rule written three times, no OrderEvent for a late-paid refund since the Refund row records it, `%40` in mailto links, which RFC 6068 allows).

  </details>

### Phase 10: The rest of the audit backlog (after V1)

**In plain words:** this phase cleared the rest of the audit backlog in 21 small batches, from accessibility and checkout copy to database rules, caching, motion, tests and docs. All 21 are done (2026-11-17).

The 125 open P2 items from the audit, ranked on 2026-11-14 into 21 small batches. Each batch's items, with the problem and the fix, are in the Next batches table of [`docs/audit/2026-11-13.md`](audit/2026-11-13.md). Work them in order, one branch and pull request each; the owner can reorder them.

- [x] **10.1 Accessibility statement gaps.** **Done 2026-11-14**.
  <details><summary>How it was done</summary>

  a pressed button keeps focus and a removed control hands it on, placeholder contrast, the header wraps at a larger text size, failed pages are titled, the checkout contact rule belongs to both fields, axe checks Day contrast, and Field ties selects and textareas. `/accessibility` lists what is left.

  </details>
- [x] **10.2 Rewards and checkout copy.** **Done 2026-11-14**.
  <details><summary>How it was done</summary>

  one total with a Reward, a fully free Order skips online payment, the free drink reads "free with 9 Stars", one Pickup Time everywhere, after Last Order the Customer is told when to walk in and when ordering opens, a Cart changed in another tab says so, and the FAQ no longer promises "any size".

  </details>
- [x] **10.3 Payment failure paths.** **Done 2026-11-14**.
  <details><summary>How it was done</summary>

  a failed online payment can be paid again from the Order page, a checkout that won't start lets the Order go and refills the Cart, PayMongo's payment.failed changes nothing, the Test Mode back link says it cancels nothing, a refused fake webhook can be tried again, a wrong Order link says how to find the Order, and the provider's failure branches are tested.

  </details>
- [x] **10.4 Orders that never close.** **Done 2026-11-15**.
  <details><summary>How it was done</summary>

  the Order page's poll and the payment webhook apply the 15 minutes, the morning cron closes Pay at Pickup Orders nobody took, one IP may place 10 Guest Pay at Pickup Orders a day, the Order page stops asking 3 hours past its Pickup Time, and trying again finishes a refund that stopped half way.

  </details>
- [x] **10.5 Cart and Pickup Times.** **Done 2026-11-15**.
  <details><summary>How it was done</summary>

  a drink's Options, quantity and note change in the Cart (PRD ORD-02), adds at once to one Cart no longer overwrite each other, ASAP takes the next window with room when the first fills, and a nearly full Pickup Time says how many drinks are left.

  </details>
- [x] **10.6 Sign-in.** **Done 2026-11-15**.
  <details><summary>How it was done</summary>

  sign-in tokens are stored only as hashes, deleting an account ends its pending links, a stranger can't use up someone's links, Google sign-in starts are limited per IP, a used link says so and keeps where it was going, and a hidden character or a broken address no longer gives a 500.

  </details>
- [x] **10.7 Staff roles and the Second Factor.** **Done 2026-11-15**.
  <details><summary>How it was done</summary>

  a Manager-level check always asks for the Second Factor and a pass lasts 12 hours, Sign out everywhere stops the Bar Screen at once, Add Staff never demotes anyone, every Staff action is tested for its role, and Baristas mark Sold Out on the Bar Screen without an authenticator.

  </details>
- [x] **10.8 Manager inputs.** **Done 2026-11-15**.
  <details><summary>How it was done</summary>

  a price over PHP 100,000 gets plain words, Stars adjustments stop at 50 and never touch a Manager's own, a Closed day needs no times, the Barista Pick refusal names the picks, Special Hours for today say how many Orders are booked after closing, and Options can be Hidden while an unused Option Group or a draft Post can be deleted.

  </details>
- [x] **10.9 Manager numbers and Sign-ups.** **Done 2026-11-16**.
  <details><summary>How it was done</summary>

  a New Inquiry is never cut off, Reports show Stars given and taken apart, the day's total reads Booked while Sales means Picked Up only, Busy Mode shows on Manage and ends from Hours, and a Manager removes a Sign-up (audited, Seats back) and is warned before stranding guests.

  </details>
- [x] **10.10 Bar Screen.** **Done 2026-11-16**.
  <details><summary>How it was done</summary>

  the Order Code never breaks on a tablet, cards show when they're due and turn Late, after a reload the board says to tap for sound, the tablet stays awake, and the arrival glow stays in New.

  </details>
- [x] **10.11 Database rules.** **Done 2026-11-16**.
  <details><summary>How it was done</summary>

  Star entries happen once and take the cafe's clock, CHECK rules refuse NULL, every database rule has a test, and the seed runs in one transaction.

  </details>
- [x] **10.12 Account data and retention.** **Done 2026-11-16**.
  <details><summary>How it was done</summary>

  Download my data holds everything kept about a Member, deleting an account is one transaction that de-identifies Sign-ups and Inquiries and keeps past Star totals, the Sign-up limits live in the content module, and abandoned guest Carts are deleted after 30 days.

  </details>
- [x] **10.13 Operations.** **Done 2026-11-16**.
  <details><summary>How it was done</summary>

  one siteUrl and authSecret that refuse to run unset, the email send gives up after 5 seconds, next/image takes only this Blob store, the database pool stops waiting after 5 seconds, photos lose their metadata and upload only after the save, local photos show at once, and the public forms catch scripted posts.

  </details>
- [x] **10.14 Lighter pages.** **Done 2026-11-16**.
  <details><summary>How it was done</summary>

  the Cart is priced once per request, a Member's pages skip the merge transaction with nothing to merge, and Home's hidden Photos view is recorded as a kept trade-off.

  </details>
- [x] **10.15 Caching and share cards.** **Done 2026-11-16**.
  <details><summary>How it was done</summary>

  Staff changes reach the menu within about 10 seconds, pause, Busy Mode and Capacity saves no longer expire every page, a Sign-up expires only Event pages, and share cards prerender with a 404 for a made-up slug.

  </details>
- [x] **10.16 Motion.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  taps land right after a page change, the Star Card lights as Home scrolls it into view, the Cart pill bumps on every rise, /account, Events and the Cart fade, the 6:00 and 18:00 palette turn crossfades, and a test runs with motion on.

  </details>
- [x] **10.17 Page polish.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  the main buttons dim on hover, the Order Code is upright sans, the header nav stays centred, no text is under 14 px, the printed menu packs into columns, blank stand-ins have no caption, Night copy names no time of day, the dietary filters mean what they say, and Markdown lists and headings render.

  </details>
- [x] **10.18 Home for Members and the demo.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  a Member's Home links to their own Stars and shows their usual one tap from the Cart, the hero card shows the next Pickup Times, Home points to the two-minute demo guide, and the hosted demo's Events, Promo and Seasonal drink roll forward on their own (owner-approved missing feature).

  </details>
- [x] **10.19 Tests.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  tests for a Refund after spent Stars, the whole Order Status table, larger text, photo limits and an HTML budget; the e2e server ignores .env.local, and the test database is seeded once.

  </details>
- [x] **10.20 Code health.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  one Concept Notice, clock.ts day helpers and one Sold Out rule, labels and numbers read from their source, a typed Options snapshot, and one primary pill in two sizes.

  </details>
- [x] **10.21 Docs.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  - the setup guide matches the live Neon and Vercel project and says previews share production data, how to restore and how to migrate safely
  - docs/03, docs/04 and the Glossary describe the code
  - ordering for tomorrow is after V1
  - Home, the FAQ and the seed say only what the cafe keeps.

  </details>

### Phase 11: Handoff and the 2026-11-17 deep check

On 2026-11-17 the whole app was checked again (security, QA and code review, six areas): no P0, 2 P1, 29 P2 and 15 P3. Each finding, in plain words with its fix, is in [`docs/audit/2026-11-17.md`](audit/2026-11-17.md) under the `DC-` numbers below. 11.1 makes the docs ready to hand over; 11.2 to 11.6 are the fixes, in order of risk. The 43 open November P3 items join the batch that already touches the same code, and 11.7 and 11.8 take the rest (owner, 2026-11-17). Each is one branch and pull request; the owner approves each before it starts.

- [x] **11.1 Handoff docs.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  every doc opens with "In plain words" and who should read it, explains its jargon and matches the code; new `docs/HANDOFF.md` (taking over the project), `docs/STAFF-GUIDE.md` (running the cafe on the site), `docs/adr/README.md` (every decision in one sentence) and the deep check, `docs/audit/2026-11-17.md`.

  </details>
- [x] **11.2 Safety first.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  - a Staff account can't be deleted from `/account`, so the cafe always keeps a Manager (DC-01)
  - CI builds the site (DC-02)
  - Prisma commands and the seed refuse a database not on this computer unless asked (DC-03)
  - outside services stay off in Vitest (DC-04)
  - a refund the provider made stays refunded when its record fails to save (DC-05)
  - a Refund counts Stars an open Reward holds, and a picked-up Reward keeps spent Stars spent (DC-06)
  - the morning job cancels and refunds a paid Order the bar never accepted (DC-07)
  - `better-auth` 1.7.25
  - Node 24.x pinned (ops:16)
  - the stray home-folder lockfile deleted (ops:18). Tests: `tests/db/privacy.test.ts`, `refunds.test.ts`, `rewards.test.ts`, `order-status.test.ts`, `tests/local-only.test.ts`, `tests/e2e-server.test.ts`.

  </details>
- [x] **11.3 Abuse limits and inputs.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  - every limit on what anyone can send without being Staff lives in `src/lib/limits.ts`, each number tested and each call checked to stay wired (DC-11)
  - Members get 5 Pay at Pickup Orders a day (DC-08)
  - an address gets 15 sign-in links in 15 minutes from anywhere, so a stranger needs five connections to use them up (DC-09)
  - an impossible Inquiry date and a fake checkout id with a hidden character get a plain refusal (DC-10)
  - Cross-Origin-Opener-Policy and no X-Powered-By (ops:20)
  - the cron secret compared in constant time (SEC2-13)
  - webhook bodies over 64 kB refused (SEC2-09)
  - SEC2-05 and ID2-13 were already in place and close. Tests: `tests/db/limits.test.ts`, `tests/limits-wired.test.ts`, `tests/db/routes.test.ts`, `tests/next-config.test.ts`, `payments.test.ts`, `weekly-inquiries.test.ts`.

  </details>
- [x] **11.4 Staff tools.** DC-12 to DC-23: the Bar Screen's pause after 12 hours and its Sold Out panel, hours and Seats warnings, photo errors, Barista Picks, Category and Event addresses, keyboard focus and screen readers in `/manage` and `/bar`.
  <details><summary>How it was done</summary>

  - November P3s with it: a11y:15 (the Bar Screen announces new Orders), DATA-11 (one default per single-choice Option Group), architecture:18 (split the Bar Screen into smaller parts while it is open for these fixes). Split in two pull requests. **11.4a, the Bar Screen, done 2026-11-17:** Pause and Busy Mode come back to the Bar Screen after the code (DC-12), in their own component (architecture:18, the Bar Screen part)
  - the Sold Out panel catches up with another device and the midnight reset (DC-13)
  - new Orders are said aloud in the live region (a11y:15)
  - keyboard focus kept as on the customer pages (DC-20, the Bar Screen part). Tests: `src/app/manage/hours/actions.test.ts`, `tests/db/menu-admin.test.ts` (soldOutStamp), `tests/e2e/bar.spec.ts`. **11.4b, the `/manage` pages, done 2026-11-17:** every change to today's hours says how many Orders are booked after the new closing (DC-14)
  - emptying Seats with Sign-ups warns (DC-15)
  - a new item's failed photo is reported (DC-16)
  - Hidden picks free their place (DC-17)
  - a Category keeps its web address (DC-18)
  - an emailed Sign-up link survives an Event's new address (DC-19)
  - Manage keeps keyboard focus (DC-20), says a wrong code (DC-21), links hours errors to their inputs (DC-22) and shows Day and Night at every width (DC-23)
  - a single-choice Option Group keeps one default (DATA-11). Tests: `tests/db/hours-actions.test.ts`, `src/app/manage/manage-actions.test.ts`, `tests/db/menu-admin.test.ts`, `tests/e2e/keyboard.spec.ts`, `manage.spec.ts`, `manage-hours.spec.ts`, `content.spec.ts`. architecture:18 stays open for the Account and Order pages.

  </details>
- [x] **11.5 Customer pages.** DC-24 to DC-37: old Event pages, Home's layout shift and hours line, the menu build fallback, fewer account reads, the demo's late-night gap, and eight small copy and form fixes.
  <details><summary>How it was done</summary>

  - November P3s with it: a11y:10 (Filipino phrases marked as Filipino), a11y:13 (checkboxes keep their size), a11y:14 (Order steps read with a space), UI1-25 (Payment Method icons), UI2-22 (borders on low-contrast panels), UI2-23 (the non-coffee stand-in icon), PERF-18 (`preload` for images), PERF-21 (the daily menu refresh). Split in two pull requests. **11.5a, data and rendering, done 2026-11-17:** an older Event's page is found however many ended since (DC-24)
  - Home's pickup card keeps its space in every state, with the Last Order note drawn in it (DC-25)
  - the open badge's first words are true every week (DC-26)
  - hiding every Category no longer fails the build (DC-27)
  - the account is read once per request (DC-28)
  - the demo's Last Order is 11:15 PM (DC-29)
  - the largest image loads eagerly (PERF-18)
  - the cron expires the menu at once (PERF-21). Tests: `tests/db/event-pages.test.ts`, `src/lib/hours.test.ts`, `src/app/(site)/menu/static-params.test.ts`, `tests/db/place-order.test.ts`, `tests/db/routes.test.ts`. **11.5b, copy and forms, done 2026-11-17:** a free Reward Order asks for nothing (DC-30)
  - the barista note survives a save (DC-31)
  - every Cart tap counts (DC-32)
  - no demo message asks for an email sign-in or inbox (DC-33)
  - a Favourite that can't be added says why (DC-34)
  - the order limit says different food items (DC-35)
  - no two-day reply promise (DC-36)
  - the privacy page lists everything an account keeps (DC-37)
  - Filipino phrases marked as Filipino (a11y:10)
  - checkboxes keep their size (a11y:13)
  - Order steps read apart (a11y:14)
  - Payment Method icons (UI1-25)
  - bordered muted panels (UI2-22)
  - a neutral non-coffee stand-in (UI2-23). Tests: `templates.test.ts`, `tests/db/bar.test.ts`, `tests/db/cart.test.ts`, `src/app/(site)/account/actions.test.ts`, `tests/e2e/members.spec.ts`.

  </details>
- [x] **11.6 Tests.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  - a paid Order a Manager cancels is refunded, and stays listed if the provider refuses (DC-38)
  - Sold Out clears at Manila midnight, not before (DC-39)
  - the full and nearly full window tests change counts only by what they add, and the full one runs once as `@cafe-wide` (DC-40)
  - checkout, an Event, the account page and Manage pass axe in Day and Night (DC-41)
  - the browser tests refuse to start after 10 PM Manila (DC-42), forbid `test.only` (DC-43) and retry a flaky test once so `@cafe-wide` still runs (DC-44)
  - the daily job's clean-ups and Demo Mode gate are tested (DC-45)
  - every Staff action file is found by glob (DC-46).

  </details>
- [x] **11.7 Payments and data hygiene.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  - a paid webhook must match the Payment's amount and currency (PAY-08) and its row keeps only the parsed ids and type (PAY-10)
  - the Member lock is FOR NO KEY UPDATE, so a Reward and a release can't deadlock (ORD-15)
  - the local email folder only in development or with MAIL_OUTBOX=1 (DATA-10)
  - Order ids default to a UUID and the schema comments match (DATA-13)
  - test-only exports say so (architecture:19)
  - the sign-in, Inquiry and Sign-up emails are tested templates (architecture:22). Tests: `tests/db/payments.test.ts`, `paymongo.test.ts`, `outbox.test.ts`, `templates.test.ts`.

  </details>
- [x] **11.8 Docs and decisions.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  - the last stale lines in docs/03, docs/05, docs/08, the PRD, the research doc and ADRs 0007, 0008, 0009 and 0013 match the code (motion:10, motion:11, ops:19, ORD-17, ID1-15, ID1-19, UI2-29, DOC-10, DOC-21, DOC-23, DOC-24)
  - DOC-08, DOC-17 and DOC-20 were already fixed
  - PERF-08, PERF-10, UI1-24, FEAT-15 and architecture:18 stay as they are, each with its reason in `docs/audit/2026-11-13.md`. No November item is open but ops:8, an owner check.

  </details>

### Phase 12: Owner requests (2026-11-17)

**In plain words:** changes the owner asked for after Phase 11, each its own pull request.

- [x] **12.1 Sticky header.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  - the customer pages' header stays at the top while a page scrolls, on a full-width band with a hairline that fades in once the page scrolls
  - the Category tabs, sticky side panels and keyboard scroll padding sit below its height (`--header-h`). Test: `tests/e2e/header.spec.ts`
  - the keyboard tests check focus is never under it.

  </details>
- [x] **12.2 Manage the menu by Category, with photos.** **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  on `/manage/menu` the pills show Everything, one Category (`?show=coffee`) or the Option Groups, the current one filled, instead of jumping down the page; every Menu Item row has its photo or stand-in. Test: `tests/e2e/manage-menu.spec.ts`.

  </details>
- [x] **12.3 Photos for Events and Posts.** Upload a photo in the Event and Post editors, as for Menu Items. **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  - the photo pipeline moved to `src/lib/photo.ts` with a folder (`menu`, `events`, `posts`)
  - the Event editor has **Photo** and the Post editor **Cover photo**, each with alt text and the saved photo shown above
  - the photo is checked before the save, stored after it, and the one it replaces is deleted, as is a deleted draft's cover
  - `next.config.ts` allows the two new Blob folders. Tests: `tests/db/content.test.ts`, `src/lib/photo.test.ts`, and the e2e "a Manager publishes an Event" now adds a photo and checks it loads on `/events`.

  </details>
- [x] **12.4 Adjust Stars with a live Star Card.** Plus and minus buttons for the Stars to add or remove, and the Member's Star Card and balance shown once their email is entered. **Done 2026-11-17**.
  <details><summary>How it was done</summary>

  - `findMemberStarsAction` (Managers only) looks the Member up once a whole email is typed
  - the card (the Star Card's constellation, now `src/components/star-cup.tsx`) shows their name, "N Stars now, M Stars after you save" and how many more make a free drink, and follows the **+** and **−** buttons (44 px, as the quantity stepper) or a typed number
  - **−** stops at zero
  - a save moves the card to the new balance. Tests: `src/app/staff-actions.test.ts` (the new action checks the Manager role) and `tests/e2e/stars-admin.spec.ts`.

  </details>
- [x] **12.5 List and Photos on the staff menu.** Requested 2026-11-18: the View switch from Home's menu on `/manage/menu`, with photo cards for checking the photos. **Done 2026-11-18**.
  <details><summary>How it was done</summary>

  - the switch is `src/components/view-choice.tsx`, shared with Home
  - on the staff menu it is two links (`?view=photos`), so the view stays with the Category pills, Sold Out taps and a reload. Photos shows each Category as cards like `/menu` (photo, name, price, Sold out today, Hidden, "No photo yet", and the Sold out button)
  - Option Groups stay a list. Test: `tests/e2e/manage-menu.spec.ts`.

  </details>
- [x] **12.6 A Staff header that stays and goes home.** Requested 2026-11-18: the Staff header stays at the top like the customer one, its logo goes to the Manage home instead of the customer site, and a button goes back to the site. **Done 2026-11-18**.
  <details><summary>How it was done</summary>

  - the header in `src/app/manage/layout.tsx` is sticky with the customer header's hairline and `HeaderHeight`
  - the logo and "Staff" are one link to `/manage`
  - **Back to the site** carries a mirrored shooting star
  - the sticky side panels on Manage pages sit below it (`top-below-header`). Test: `tests/e2e/header.spec.ts`.

  </details>
- [x] **12.7 Status lines up to date.** **Done 2026-11-18**.
  <details><summary>How it was done</summary>

  README, this section 0, `docs/HANDOFF.md` and the deep check's settings table say Phase 12 is done and which owner steps are done. Also from 2026-11-18: CI's dependency audit is `scripts/audit.mjs` (`npm run audit`), which lets through only a listed advisory that reaches nothing but the test runner (picomatch GHSA-fc5q-39xc-vjpf, no fix published yet; owner approved), each with its reason.

  </details>
- [x] **12.8 A published change shows at once.** After a Manager saved, the page with a slug in its address showed the old version until its one-minute timer: 53 s for a Post's own page, while `/news` was fresh at once (measured on `next start`). The saved pages carried the `content` tag, but `updateTag` did not reach them. **Done 2026-11-18**.
  <details><summary>How it was done</summary>

  `refreshPublic(tag)` in `src/lib/refresh.ts` is `updateTag` plus `revalidatePath` for each slug route that reads the tag, used by every Server Action that refreshed a tag (menu, Sold Out, hours, cafe details, Events, Posts, Sign-ups). Measured after: the Post page 0.8 s, the Event page 0.5 s, on the first visit. Tests: new e2e "a saved Post and Event show on their own pages on the next visit", and "a Manager changes a price" now also reads the Menu Item's own page.

  </details>
- [x] **12.9 "A concept cafe".** Requested 2026-11-18: the docs describe Hoshikopi as a concept cafe, without "in Metro Manila".
  <details><summary>How it was done</summary>

  Done 2026-11-18 in README, CLAUDE.md, the glossary, the handoff guide, the PRD, the case study, the design system and the demo script. Facts stay as they are: the cafe keeps Manila time, the research is about real Manila cafes, and the Visit page still shows its invented neighbourhood (PRD section 2).

  </details>
- [x] **12.10 Docs a beginner can read.** Requested 2026-11-18: every doc easy to follow for someone with basic or no coding knowledge. **Done 2026-11-18**, in five parts. Part (e): this roadmap shows one short line per batch, with its build notes folded under "How it was done" (visible long sentences 152 to 18); the ADRs stay as written, and the ADR and audit indexes point onward.
  <details><summary>How it was done</summary>

  - In small pull requests: (a) a "Start here" page with reading paths and the coding words explained, README and the handoff guide
  - (b) the staff guide, glossary, demo script, case study, metrics and assets
  - (c) the PRD, architecture, data model, setup and tooling
  - (d) the design system and the research
  - (e) this roadmap, the ADRs and the audit indexes (the audit records keep their text). Part (a) done 2026-11-18: `docs/README.md`, the docs map (a reading path for each kind of reader, every document with its length, how each document is laid out, and about 50 coding words explained for beginners)
  - README trimmed to the front door
  - the handoff guide with each problem as its own steps, stale lines fixed, and a "Where to go next". Part (b) done 2026-11-18: the staff guide, glossary, demo script, case study, metrics and assets have no sentence over about 30 words left, a "Where to go next" each, and the case study's audit lines say every finding is fixed. Part (c) done 2026-11-18: the PRD, architecture, data model, setup and tooling, with lists for the run-on lines, the requirement areas as a table, the PRD's build status brought up to date, and a "Where to go next" each
  - the requirement and column tables keep their exact wording. Part (d) done 2026-11-18: the design system's prose split into short sentences and lists (the reduced-motion rules as a list), and a "Where to go next" in it and the research
  - the research stays a dated record, read from its Summary.

  </details>

### Phase 13: The 2026-11-18 deep check

**In plain words:** a second deep check after Phase 12 found no P0 or P1, 2 P2 and 7 P3 items ([docs/audit/2026-11-18.md](audit/2026-11-18.md)). The owner asked to fix them all (2026-11-18). One small pull request each.

- [x] **13.1 A limit on guest Carts** (CK-01). Adding or changing a Cart Line: 60 per 15 minutes per IP, and at most 30 Lines in a Cart. **Done 2026-11-18** (tests first).
  <details><summary>How it was done</summary>

  - `limits.addToCart` in `src/lib/limits.ts`, checked by `addToCartAction` and `changeLineAction` before the Cart is touched, so a refused add makes no guest Cart
  - `addLine` refuses a new choice in a Cart with 30 Lines (`cart_full`); more of a choice already in it still works
  - a Favourite added to a full Cart says so on `/cart`
  - Tests: `tests/db/limits.test.ts`, `tests/limits-wired.test.ts` (both actions call the limit), `tests/db/cart.test.ts`

  </details>
- [x] **13.2 Page speed** (CK-02). Bring total blocking time under 200 ms on Home, `/menu` and a Menu Item page. **Done in part 2026-11-18:** Home and `/menu` are under; the Menu Item page is about 35 ms over (median 234 ms, Performance 90).
  <details><summary>How it was done</summary>

  - Measured on a local production build, Lighthouse 12.8.2 mobile, the median of 3 runs per page (PageSpeed Insights was over its daily quota)
  - `HeaderHeight` (batch 12.1) set `--header-h` on `<html>` on every page load, which restyles every element; it now sets it only when the header's height differs from the stylesheet's 68 px, so on most screens never
  - Total blocking time before and after: `/menu` 218 to 192 ms, the Menu Item page 388 to 304 ms (Performance 84 to 87); Home 190 ms after
  - A CPU profile (4x slower CPU) showed the money formatter as the page's biggest cost of its own, 121 ms: `toLocaleString("en-PH")` built a locale formatter on every price, and the Option Picker formats one per choice. `src/lib/money.ts` now adds the commas itself; the Menu Item page went from 304 to 234 ms, Performance 87 to 90
  - Tried and undone: `content-visibility: auto` on the footer, and the phone menu without its live links; neither changed anything measurable
  - Left: about 35 ms on the Menu Item page, all in loading the Next.js and React runtime (about 415 kB) and bringing the page to life. The next step would be to bring the Option Picker to life a moment later, which risks a slower first tap

  </details>
- [ ] **13.3 Photos** (CK-03, CK-04). Cap the pixels an upload may unpack to and shrink photos; a Remove photo choice.
- [ ] **13.4 The small rest** (CK-05 to CK-08). `robots.txt`; the site's description; the e2e photo left behind; the steps for a preview database.

## 13. After V1 (not scheduled)

These are ideas for later. Nothing here is planned, dated or promised, and new features are on hold (owner). The list is here so nobody has to wonder whether an idea was considered.

Possible features:

- The installable app (a PWA, a website that can be added to a phone's home screen like an app) with push notifications to a locked phone.
- Ordering for tomorrow.
- More than one cafe.
- Delivery partners.
- Gift cards.
- Loyalty tiers.
- Table QR ordering.

Real launch requirements (Hoshikopi is a concept, so none of these is built):

- Business registration.
- BIR receipts (official receipts from the Philippine tax office).
- Internet Transactions Act duties (the rules for online merchants).
- Live payment keys.
- The senior citizen and PWD (person with disability) discount under RA 9994, RA 10754 and JMC 01-2022.
- A paid database plan with longer backups.
- Real photos and staff.

## 14. Definition of done (every batch)

A batch counts as done only when every point below is true.

1. The requirement IDs it covers work end to end in the browser.
2. Rules for money, Capacity, Prep Time, Stars, Order Status and webhooks have tests that fail without the code.
3. `npm run qa` green (and `qa:full` for anything visible); zero axe violations (axe is the automatic accessibility checker) on touched pages, in both palettes.
4. Words match `GLOSSARY.md`; no em dashes in UI copy; invented details carry the Concept Notice.
5. Docs updated: this roadmap ticked, any changed document edited, an ADR (a short decision note) for any decision.
