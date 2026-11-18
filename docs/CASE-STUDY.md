# Hoshikopi: a case study

> **In plain words:** This is the story of building Hoshikopi, told by the person who built it: the problem it solves, what the site does, how it is made, the decisions that mattered and the measured results. It is written for someone judging the project, such as a reviewer, a client or an employer. Technical words are explained where they first appear, and every number is kept.
>
> **Who should read it:** reviewers and anyone deciding whether to hire, trust or continue the project; the owner, as a one-page summary of the whole build. The first three sections need no technical background.
> **Last checked:** 2026-11-17 (the measured numbers are from 2026-11-14).

## Contents

1. [The problem](#the-problem)
2. [What it does](#what-it-does)
3. [How it is built](#how-it-is-built)
4. [Decisions that shaped it](#decisions-that-shaped-it)
5. [Quality](#quality)
6. [The numbers](#the-numbers)
7. [How I worked](#how-i-worked)
8. [What I would do next](#what-i-would-do-next)

A concept cafe and the website that runs it: order ahead for pickup, pay, collect Stars (the loyalty points: one per drink, nine for a free drink), and a Bar Screen (a page on a tablet behind the counter) for the baristas. A portfolio project. The cafe, its people and its photos are invented, and no real money moves ([ADR 0006](adr/0006-concept-project-no-real-money.md)). Product words such as Menu Item, Order Code and Pickup Window are defined in the [Glossary](../GLOSSARY.md).

**Live demo:** https://hoshikopi.vercel.app · **Code:** https://github.com/xtiannjose/Hoshikopi

![Home in the Day palette](screenshots/home-day.jpg)

## The problem

A neighbourhood cafe loses the morning rush to the queue. People who would buy a kopi on the way to work skip it when the line is out the door, and the bar gets ten orders at once and then nothing. The usual fixes are a delivery app, which takes a large cut and hides the cafe's own brand, or a generic online store, which knows nothing about how a coffee bar works.

I wanted a site that does both jobs a small cafe needs:

- **Sell the place:** the room, the menu, the hours, the events, so people want to visit.
- **Run the counter:** take orders ahead without promising more than the bar can make, take payment the way Filipinos pay (GCash, Maya, card, or cash at pickup), reward regulars, and give the baristas one screen that shows what to make next.

## What it does

Customers get a menu they can customize and a way to order ahead; staff get one screen to run the counter and an admin area to run the cafe. The table below puts the two sides next to each other.

| Customers | Staff |
| --- | --- |
| Browse the menu, choose Options (size, milk, sugar, ice) and see the price change as they choose | The **Bar Screen**: new Orders chime in, and one tap moves each one through Accepted, Preparing, Ready and Picked Up |
| Order ahead for As Soon As Possible or a 15-minute Pickup Window, as a Guest or a Member | The Manager edits the menu, prices, Sold Out, hours, Capacity, Prep Time, Events and Posts |
| Pay with GCash, Maya or card in a Test Mode checkout (practice payments, no real money), or at the counter | Pause ordering or turn on Busy Mode (extra minutes added to the estimated wait) when the bar is swamped |
| Watch the Order move live on its own page, with a chime when it is Ready | Refunds, a day's Orders and sales, and Star adjustments |
| Collect a Star per drink; nine make a free drink | A Second Factor (a 6-digit code from an authenticator app) for every Manager screen |

The look follows the cafe's own clock: cream paper by day and a night sky from 6 PM Manila time, for every visitor wherever they are ([ADR 0010](adr/0010-theme-follows-manila-time.md)).

| | | | |
| --- | --- | --- | --- |
| ![The menu on a phone, Day palette](screenshots/menu-phone-day.jpg) | ![A Menu Item with its Options, Night palette](screenshots/item-phone-night.jpg) | ![Checkout with the Test Mode payment methods](screenshots/checkout-phone-night.jpg) | ![An Order's live status page](screenshots/order-phone-night.jpg) |

![The Bar Screen with three new Orders](screenshots/bar-night.jpg)

## How it is built

This section is for readers who want to know what the site is made of. Skip to "Decisions" if you only want the reasoning.

**Stack** (the tools it is built from): Next.js 16 (a web framework; App Router and Cache Components are its newer ways to organise pages and save built pages), React 19 (the library that draws the screens), TypeScript (JavaScript with type checking, which catches mistakes early), Tailwind CSS 4 (styling), PostgreSQL through Prisma (the database and the tool that talks to it; Docker runs it on my PC, Neon hosts it online), Better Auth (sign-in by email link and Google), Vercel (the host) with Vercel Blob (storage for uploaded photos), and Resend (an email service) once a domain is verified: it is not set up yet, so the demo sends no email. Tests: Vitest against a real Postgres database, Playwright (drives a real browser) with axe (finds accessibility mistakes), and Lighthouse (Google's page-quality score).

**One app, nine modules** ([ADR 0001](adr/0001-modular-monolith-nextjs.md)): `cafe`, `cart`, `content`, `identity`, `loyalty`, `menu`, `notify`, `ordering` and `payments`. Each owns its tables and is imported only through its `index.ts`. A lint rule, run as a test, fails the suite if one module reaches into another's internals.

**Public pages are prerendered** (built ahead of time) and refreshed by cache tag (`menu`, `hours`, `content`: a label that says which saved pages to rebuild), so the menu loads like a static site. When a Manager changes a price, only the pages that show it are rebuilt. Server Components (code that runs on the server, not in the visitor's browser) are the default. The few client components (code that runs in the browser) are small leaves with state, and there is no component or animation library, only native elements and CSS ([ADR 0011](adr/0011-native-elements-and-css.md)).

## Decisions that shaped it

An ADR (architecture decision record) is a short note that records one decision and why it was made. Fifteen of them are in [docs/adr/](adr/). These six did the most:

1. **Money is integer centavos** ([0002](adr/0002-money-as-integer-centavos.md)). `PHP 165.00` is `16500`, and one file formats it. The server prices everything: the browser's total is only displayed, never trusted. A Reward, a Price Delta and VAT are all integer arithmetic, so there are no rounding surprises.
2. **Pickup Windows with Capacity and an honest Prep Time** ([0007](adr/0007-pickup-windows-and-capacity.md)). Orders land in 15-minute windows, each holding a set number of drinks. The check runs under a row lock (the database makes a second request wait its turn) inside the transaction (a group of database changes that all happen or none do) that places the Order, so two phones can't both take the last slot. Prep Time counts the drinks already on the bar, plus this Order's own, plus Busy Mode. A full window is never offered.
3. **Order Status changes only through `transition()`**, against one table of who may move an Order from where to where. The Bar Screen, the webhook, the Customer's cancel and the expiry sweep all go through it, and every move writes an `order_events` row.
4. **Payment state comes only from verified webhooks** ([0003](adr/0003-payments-paymongo-test-mode.md)). A webhook is a message the payment company's server sends ours when a payment changes. The return URL (the page the customer lands on after paying) decides nothing. Events are deduplicated under a unique key, and a payment that arrives after its Order closed is refunded. Payments sit behind an interface with a PayMongo adapter that refuses live keys, and a `fake` provider (a stand-in payment page) that refuses production domains. The demo runs on `fake`: PayMongo paused new sign-ups in November 2026, so I never set up an account, and the PayMongo adapter is built and unit-tested but has not run against PayMongo's test system.
5. **Stars are a ledger, not a number** ([0008](adr/0008-stars-ledger.md)). Every earn, reserve, release, reverse and adjust is a row, and the balance is their sum. A cancelled Order releases its reserved Stars in the same transaction that cancels it.
6. **Polling before realtime** ([0009](adr/0009-live-updates-by-polling.md)). The Bar Screen asks every 3 seconds with a version string, and the server answers "no change" cheaply. The Order page slows down once the Order is Ready. That is enough for one cafe, and it runs on Vercel's free tier. (Polling means asking again on a timer. The alternative is a connection the server keeps open; I left it for later, see the last section.)

Two later decisions came from watching the demo. Being honest about a concept project ([0012](adr/0012-concept-images-with-stand-ins.md)) means every invented detail is labelled and photos have labelled stand-ins until real ones exist. **Demo Mode** ([0015](adr/0015-demo-mode-visitor-plays-the-barista.md)) lets a reviewer who opens the link alone play the barista on their own Order, and the hosted demo takes Orders all day, so it works from any time zone.

## Quality

This section says how I checked the work: tests for the rules that matter, a full audit and automatic checks on every change.

**The tests are built around the rules that cost money or trust.** Money, Capacity, Prep Time, Stars, Order Status and the webhook handlers were each written test-first against the real test database. In a Phase 9 spot-check, 7 rule mutations (a Price Delta dropped, a Reward ignored, Capacity off by one Order, a skipped Order Status step, a Reward drink earning a Star, Prep Time rounding, centavos dropped) were each caught by the suite. One was caught only after the spot-check found the gap and a test was widened ([METRICS.md](METRICS.md#3-rules-that-fail-their-tests-when-broken)).

**An audit, then the fixes.** Before calling it done, I had the whole site audited across 16 areas: security, payments, ordering, data, performance, accessibility, staff tools, customer journeys, motion, tests, operations and more. That produced 371 findings. Each one was double-checked by a second reviewer before it was ranked, leaving 205 open items: 2 P0, 18 P1, 142 P2 and 43 P3 ([audit/2026-11-13.md](audit/2026-11-13.md)). (P0 means must fix now, P1 serious, P2 should fix, P3 polish.) Both P0s and 17 of the 18 P1s are fixed, one small pull request (a proposed change that I review before it joins the project) at a time, each with a test that failed first. The 18th P1 is data on the live site that the Manager refreshes. Ten small P2 fixes followed, and by 2026-11-17 Phase 10 had cleared the rest of the P2 backlog; the 43 P3 polish items stay open. A few examples of what the audit caught:

- A Category with no stand-in icon crashed the whole menu.
- The hosted demo was closed for most of a reviewer's day in Europe and the US.
- ASAP always promised 5 minutes, whatever was already on the bar.
- Keyboard focus dropped to the page body after every client navigation, because Next.js 16 keeps the old page in the DOM hidden.
- Under reduced motion, one Day and Night switch started 645 CSS transitions.

**A second deep check.** On 2026-11-17 I had the whole app checked again for security, quality and code review. It found no P0, 2 P1, 29 P2 and 15 P3, each explained in plain words with its fix in [audit/2026-11-17.md](audit/2026-11-17.md). The fixes are the next batches (Phase 11 in the [roadmap](07-ROADMAP.md)).

**CI** (continuous integration: an automatic check on every proposed change) runs lint (a style and mistake checker), Prettier (a code formatter), the type check, Vitest against a Postgres service and `npm audit` (a scan for known security problems in the libraries used) on every pull request. Dependabot (a GitHub bot) opens grouped weekly updates.

## The numbers

These are the results of the five targets set at the start. Lighthouse scores a page out of 100; axe counts accessibility mistakes (WCAG 2.2 AA is the international standard it checks against); a throttled phone is a test that slows the computer and network to a mid-range phone's speed.

Measured 2026-11-14 ([METRICS.md](METRICS.md)). Later batches changed the code, so measure again before quoting them as current:

| | |
| --- | --- |
| A Guest orders and pays on a throttled phone (4x CPU, slow 4G) | 8.7 to 9.1 s, target under 60 s |
| Lighthouse on the live site (PageSpeed Insights, mobile and desktop) | 100 for Performance, Accessibility and Best Practices on Home and `/menu` |
| Mobile Lighthouse Performance, local build | Home 89, `/menu` 91, a Menu Item 91 |
| Lighthouse Accessibility | 100 on all three |
| axe violations (WCAG 2.2 AA tags), both palettes, 375 and 1280 px | 0 |
| JavaScript on first load | under 170 kB on the 7 main public pages (a test) |
| Tests | Vitest 256, Playwright 233 (191 run per pass, the rest are size-specific) |
| Code | about 23,600 lines of TypeScript in `src`, 7,600 in tests, 210 commits |

## How I worked

This section says how one person built a project this size.

The project was planned before any code was written. There is a PRD with requirement IDs, an architecture document, a data model, a design system, a glossary every name in the code follows, and a roadmap of small batches with a definition of done. I built it with Claude Code as the coding agent, working batch by batch from that roadmap. I set the scope, made the decisions the ADRs record, and reviewed and merged each pull request. Each batch is one branch and one pull request with Conventional Commits (a standard way to word commit messages), merged into `main` (the project's main line) with a merge commit.

## What I would do next

The roadmap in [docs/07-ROADMAP.md](07-ROADMAP.md) is the source of truth for what is scheduled. These are the things I would do beyond it.

- **Real launch requirements:** business registration, BIR-compliant receipts, the Internet Transactions Act, live PayMongo keys, the senior citizen and PWD discount (20% plus VAT exemption), real photos and real staff.
- **A verified email domain**, so the live demo can send links to any address instead of Google sign-in only.
- **Push notifications to a locked phone** through an installable app, instead of a chime on an open page.
- **Server-Sent Events** in place of polling, if the polling cost or delay is ever measured as a problem.
- **The deep check's fixes and the P3 polish:** Phase 10 closed every open P2 item, so what is left is the 43 P3 items and the 46 findings of the 2026-11-17 deep check (2 P1, 29 P2, 15 P3), which Phase 11 fixes in order of risk.
