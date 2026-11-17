# Product Requirements: Hoshikopi

> **In plain words:** This is the PRD (product requirements document): the list of what Hoshikopi must do, who it is for and what is left out. Every rule has an ID such as ORD-03, so a test, a commit or the roadmap can point at exactly one requirement. When someone asks "is X part of the product?", the answer is here.
>
> **Who should read it:** the owner and anyone planning a change, before changing scope; developers and testers, to find the rule behind a feature.
> **Last checked:** 2026-11-17.

Owner: project lead. Update this document before changing scope. Words follow the [Glossary](../GLOSSARY.md) (the list of product words, such as Menu Item, Order Code and Star, that the docs, the site and the code all use the same way).

## Contents

1. [Summary](#1-summary)
2. [Assumptions](#2-assumptions)
3. [Personas](#3-personas)
4. [Scope by release](#4-scope-by-release)
5. [Functional requirements](#5-functional-requirements) (5.1 Menu and cafe info, 5.2 Cart and checkout, 5.3 Payments, 5.4 Accounts and loyalty, 5.5 Events and news, 5.6 Staff)
6. [What makes Hoshikopi different](#6-what-makes-hoshikopi-different)
7. [Non-functional requirements](#7-non-functional-requirements)
8. [Success metrics](#8-success-metrics)
9. [Risks and open questions](#9-risks-and-open-questions)

## 1. Summary

This section says what Hoshikopi is and what the project is judged by. Read the four goals first: every other section serves them.

Hoshikopi is a concept cafe in Metro Manila and the website that runs it. The site sells both the menu and the place: Customers see the room and plan a visit, browse the menu, customize drinks, order ahead and pick up at the counter, pay online (GCash, Maya, Card) or at pickup, collect Stars toward free drinks, and follow the cafe's Events and Posts. Baristas run live Orders from a Bar Screen (a page on a tablet behind the counter that lists the Orders to make); the Manager edits the menu, hours and content without a developer.

It is a portfolio project: the cafe, its address and its people are invented and labelled as such (the Concept Notice, the visible note that says so), and online payments run in Test Mode only (practice payments that never move real money). Everything else is built as if the cafe were real, so the site could become a real cafe's site without a rebuild.

**Goals**

1. A Customer can order a customized drink for pickup in under 60 seconds on a mid-range phone.
2. A new Order appears on the Bar Screen within 5 seconds, and a Barista moves it to Ready with one tap.
3. The Manager can change a price, mark a Menu Item Sold Out, set Special Hours or publish an Event without a developer.
4. The site is a portfolio piece: mobile Lighthouse performance 90 or more on the menu (Lighthouse is Google's free tool that scores a page's speed and quality out of 100), WCAG 2.2 AA (the international web accessibility standard, level AA: usable with a keyboard or screen reader, readable colours), clean code with tests for every money and Order Status rule.

**Non-goals for the first release**: delivery, table reservations, more than one cafe, native mobile apps, real payments, ingredient stock tracking, a point-of-sale system, gift cards, third-party delivery apps.

**Build status (2026-11-17).** The Must and Should requirements below were built in Phases 0 to 8 of [the roadmap](07-ROADMAP.md) (most in Phases 0 to 6) and kept working through the audit fixes of Phases 7 to 10. Phase 11 (handoff docs and the fixes from the 2026-11-17 deep check, [docs/audit/2026-11-17.md](audit/2026-11-17.md)) is next. Two things run in a reduced form because nothing outside the project is set up: online payments use the `fake` provider (no PayMongo account exists; the PayMongo adapter is built and unit-tested but has never run against PayMongo's test system), and the demo does not send email (Resend, the email service, has no verified domain). The photos are still stand-in panels; real photos are on hold. To take over the project, start with [HANDOFF.md](HANDOFF.md).

## 2. Assumptions

This section lists the facts the whole project rests on: where the cafe is, when it opens, how it is paid, what it costs to run. Change a row here and every other document should follow. "Invented" rows are shown to visitors with the Concept Notice. "Built" rows name the phase that built them; "confirmed" and "decided" rows carry the date the owner settled them.

| Topic | Assumption | Status |
| --- | --- | --- |
| What it is | A concept cafe for a portfolio; no real business | confirmed 2026-10-30 |
| Market | Metro Manila, Philippines | confirmed 2026-10-30 |
| Cafe location | One invented cafe in Kapitolyo, Pasig. The site shows the neighbourhood only, with no street or house number, and the map pin sits on a public spot, so the address can never lead anyone to a real home (research C-54) | invented |
| Contact details | No phone number is shown; questions and large Orders go by email, to an address the owner controls; until the owner has a domain it is the reserved `hello@hoshikopi.example`, which receives no mail (roadmap section 4, batch 2.6). No social links until the owner runs real accounts (research C-54) | confirmed 2026-10-30 |
| Room and menu photos | AI-generated concept images of one consistent room and menu, labelled "Concept image" (research C-43, [ADR 0012](adr/0012-concept-images-with-stand-ins.md)); stand-in panels until they are made (real photos are on hold, owner, 2026-11-07) | confirmed 2026-10-31 |
| Look | The Night wireframe's layout; the Day palette (colour set) from 6:00 AM and the Night palette from 6:00 PM, Manila time; visitors can pin one (ADR 0010) | confirmed 2026-10-30 |
| Locale and time | English (`lang="en"`, the language tag browsers read; numbers formatted as `en-PH`, Philippine English), Filipino-English voice; Manila time (`Asia/Manila`) | built (Phase 0) |
| Currency | PHP (Philippine pesos), prices include VAT (value-added tax), shown as `PHP 165` (no centavos, the hundredths of a peso, on the menu) | built (Phases 0 and 1) |
| Opening Hours | 7:00 to 21:00 daily; orders accepted until 20:30 | invented |
| Fulfilment | Online Orders are pickup only, at the counter. The cafe also takes walk-in Dine-in, with no table bookings (research C-45) | confirmed 2026-10-30 |
| Payment Methods | GCash, Maya, Card in Test Mode, through the `fake` provider (a stand-in payment page that behaves like the real one) while PayMongo (the Philippine payment company) has paused sign-ups (ADR 0003); Pay at Pickup | decided 2026-11-07 |
| Loyalty | 1 Star per drink; 9 Stars for a free drink; a Birthday Treat once a year | built (Phases 4 and 6) |
| Menu size | 19 Menu Items in 6 Categories (as seeded), with invented names, prices and stand-in photos | invented |
| Stack | Next.js 16 (the web framework), TypeScript (the programming language), Tailwind (styling), PostgreSQL with Prisma (the database and the tool that talks to it), Better Auth (sign-in), Vercel (the host) (ADR 0001, 0004, 0005) | confirmed 2026-10-30 |
| Brand name | "Hoshikopi" (hoshi, Japanese for star; kopi, coffee in Malay and Indonesian, close to Filipino kape) | confirmed 2026-10-30 |

## 3. Personas

A persona is a made-up person who stands for a kind of real user. We check each feature against them, so a choice stays concrete ("would Tita Lorna manage this?") and not abstract.

**Hoshi, 28, office worker in Ortigas (primary).** Orders an iced Spanish latte on the jeep ride in and wants it ready on arrival. Pays by GCash. Will not wait in line if the app says "ready in 8 minutes" and it takes 20.

**Migs, 21, student.** Studies at the cafe two afternoons a week, collects Stars, follows open-mic Events. Pays by Maya or at the counter.

**Tita Lorna, 47, family buyer.** Orders a box of pastries and four drinks for the family on Saturday mornings, schedules pickup for 9:00, pays at pickup. Uses a large font size on her phone.

**Annika, barista.** Works the Bar Screen on a tablet with wet hands and a queue waiting. Needs big targets, a clear order of what to make next, and a loud cue for a new Order.

**Christian, manager.** Sets prices, marks the croissants Sold Out at 2 pm, adds a latte art night, pauses ordering when the bar is swamped. Non-technical.

## 4. Scope by release

This section says what ships in which release. MVP means minimum viable product: the smallest complete version that works end to end. V1 means version 1: the first full release, which adds the features that make it pleasant. "Later" is not planned. Phase numbers point at [the roadmap](07-ROADMAP.md). Status on 2026-11-17: the MVP and V1 are both built; "Later" is untouched.

| Release | Contents |
| --- | --- |
| **MVP (Phases 0 to 5)** | Menu with Categories, photos and Option Groups; cafe info (hours, Special Hours, map, the space in photos, Amenities, visit FAQ, story); Home that opens with the room and both "Order ahead" and "Plan your visit"; share cards; an About this concept page; Allergens on every Menu Item; Day and Night copy; a Last Order countdown; Cart and checkout for As Soon As Possible or Scheduled Pickup with Capacity; Payment Methods GCash, Maya, Card (Test Mode) and Pay at Pickup; Order status page with live updates; Bar Screen; Manager pages for menu, Options, Sold Out, hours, Capacity, Ordering Paused, Refunds; Member accounts (email link, Google); Stars, Star Card and Rewards; Events and Posts; order emails; Concept Notice |
| **V1 (Phase 6)** | Favourites and one-tap reorder; Event sign-up with a cap; Recurring Events; Inquiries for private events and large Orders; Pairings; Day and Night Barista Picks; time-boxed Promos and seasonal Menu Items; "your order is ready" alerts on the Order page; reports for the Manager (sales by day, top Menu Items); Popular this week; add to calendar for Events; calorie estimates per Menu Item. Decided 2026-11-01: the site stays English only (no Filipino language); the installable app (PWA, a website that installs like an app) with push notifications (alerts that reach a locked phone) waits until after V1; no Guest newsletter |
| **Later** | More than one cafe; delivery through partners; gift cards; tiers in loyalty; table QR ordering; a real launch with a real business (see section 9) |

## 5. Functional requirements

A functional requirement is one thing the site must do. Each has an ID made of an area and a number (MENU for the menu, INFO for cafe information, ORD for ordering, PAY for payments, ACC for accounts, LOY for loyalty, EVT for Events, NEWS for Posts, STAFF for staff tools). Priority: **M** must (MVP), **S** should (V1), **C** could (later). IDs are stable; use them in commits and tests. "Research C-nn" points at an idea in [the cafe research](02-RESEARCH-CAFES.md); "audit" points at a finding in [docs/audit/](audit/README.md).

### 5.1 Menu and cafe info

What visitors see before they order: the menu, and the cafe as a place to visit.

| ID | Requirement | Priority |
| --- | --- | --- |
| MENU-01 | The menu lists visible Menu Items by Category with name, photo, short description, Base Price and badges (new, best seller, Barista Pick, contains nuts, vegan) | M |
| MENU-02 | A Menu Item page shows its Option Groups with required and optional choices, Price Deltas, and the running price | M |
| MENU-03 | Sold Out Menu Items and Options stay visible, greyed, with "Sold out today"; they cannot be added | M |
| MENU-04 | The menu works without signing in and is fast on a phone (prerendered, meaning built ahead of time so the page opens at once; prices and Sold Out update within a minute of a change) | M |
| MENU-05 | Search and dietary filters (vegan, no caffeine, nut-free) | S |
| MENU-06 | Seasonal Menu Items: an optional last day after which the Menu Item is Hidden by itself, built with Promos. Until then the Manager hides them by hand (research C-47) | S |
| MENU-07 | Every Menu Item page shows its Allergens ("Contains: milk"), what an Option adds ("Almond milk adds tree nuts"), and one line on the shared kitchen; "No common allergens" when there are none (research C-06) | M |
| MENU-08 | A Pairing on the Menu Item page ("Goes well with Ube Pandesal"): one Menu Item with photo and price, added to the Cart in one tap | S |
| MENU-09 | Popular this week on Home: the most ordered drinks in the last 7 days from real Orders, labelled as demo data, shown only once there are enough Orders (research C-57) | S |
| MENU-10 | A calorie estimate on each Menu Item for its default version, labelled "concept estimate", edited by the Manager (research C-08; invented, like every detail, ADR 0006) | S |
| INFO-01 | Cafe page: Opening Hours, today's hours with Special Hours applied, "open now" state, the neighbourhood, map link, how to get there, email | M |
| INFO-02 | Structured data (labels in a page's code that tell search engines what it describes) for the cafe (CafeOrCoffeeShop with hours, address, Amenities as `amenityFeature`, `smokingAllowed`, `acceptsReservations` false, a room `photo`, `hasMap`) and for Events | M |
| INFO-03 | Concept Notice on every page footer and at checkout, linking to the About this concept page | M |
| INFO-04 | The space: 4 to 6 photos of the room on the cafe page and one on Home, with a short paragraph of concrete facts (seats, light, how it feels by day and by night) (research C-43) | M |
| INFO-05 | Amenities on the cafe page: Wi-Fi, power outlets with a laptop note, pets, smoking, restroom, step-free entrance and accessible restroom, parking with the nearest car park. An Amenity with no value is left out, never guessed. A short FAQ answers from the same facts, plus ordering and Stars questions: cancelling until Accepted, Refunds, the Pay at Pickup limit, how Stars work, large Orders (research C-44, C-51) | M |
| INFO-06 | One line joins pickup and Dine-in on the cafe page, the menu and the Order page: order here for pickup, or walk in and stay (research C-45) | M |
| INFO-07 | Story on the cafe page: origin, a founder note, where the coffee comes from (regions, never a real roaster), the team by first name and role or not at all; every invented person is labelled (research C-48) | M |
| INFO-08 | Home opens with a room photo, today's hours and two actions, Order ahead and Plan your visit; three Barista Picks under "Barista picks this week"; today's hours, the neighbourhood and a directions link on the first phone screen (in the hero pickup card), and the full visit block at the end of Home (research C-42, C-46) | M |
| INFO-09 | Share cards (the picture and title shown when a link is pasted into a chat or social post) on every public page: Menu Item, Event and Post pages share their own photo with alt text; every other page shares one branded image (research C-49) | M |
| INFO-10 | An About this concept page: what is invented (address, people, prices, photos), what is real (the code, Test Mode payments), and later the case study (research C-55) | M |
| INFO-11 | Inquiry form for private events and large Orders (name, email, date, guests, message), saved for the Manager, who gets an email; Concept Notice on the form (research C-53) | S |
| INFO-12 | Day and Night copy: the Home headline and line change with the palette (one line per palette, neither naming a time of day, since a pinned palette shows all day); both are in the page and the palette shows one (ADR 0010) | M |
| INFO-13 | Day and Night Barista Picks: the Manager picks three for each palette, and Home shows the set for the current one | S |

### 5.2 Cart and checkout

How a Customer chooses drinks, picks a time and places an Order.

| ID | Requirement | Priority |
| --- | --- | --- |
| ORD-01 | Add a Menu Item with chosen Options, quantity and a note to the Cart; identical choices merge into one Line | M |
| ORD-02 | The Cart shows Lines, Options, Line totals and the Order total; edit quantity and Options; remove | M |
| ORD-03 | Choose As Soon As Possible (shows Prep Time) or a Scheduled Pickup in a 15-minute Pickup Window later today, within Opening Hours and Special Hours; each window starts after now plus Prep Time and the last one ends at closing time; Orders are taken until Last Order (research C-09, audit D-7). Ordering for tomorrow is after V1 (roadmap section 13) | M |
| ORD-04 | Pickup Windows that are full (Capacity) or past are not offered; the server re-checks Capacity when the Order is placed | M |
| ORD-05 | Guest checkout is the main path: a name and a phone number or email; Members are prefilled. After a Guest's Order, offer an account to keep Stars (research C-15) | M |
| ORD-06 | Prices, Price Deltas, Rewards and totals are recomputed on the server; client totals are never trusted | M |
| ORD-07 | Checkout is refused, with a clear message, when the cafe is closed or Ordering Paused | M |
| ORD-08 | After placing, the Customer sees the Order Code, Pickup Time and an Order status page that updates live (Placed, Paid, Accepted, Preparing, Ready, Picked Up) | M |
| ORD-09 | A Customer can cancel an Order until it is Accepted; a paid Order is Refunded in full | M |
| ORD-10 | Order confirmation and "ready for pickup" emails | M |
| ORD-11 | Favourites and one-tap reorder of a past Order | S |
| ORD-12 | An Order holds at most 15 drinks; larger orders are asked to email the cafe, and to send an Inquiry once INFO-11 exists (research C-14, C-53) | M |
| ORD-13 | In the 60 minutes before Last Order, the hero pickup card and checkout show "Last order in 25 min"; after Last Order they say when ordering opens again | M |
| ORD-14 | When an open Order page sees the Order turn Ready: a short chime, a vibration, "Ready! <Order Code>" in the tab title, and a browser notification (a pop-up from the browser itself) if the Customer tapped "Notify me when it's ready"; the page keeps checking every 15 seconds while the tab is hidden | S |

### 5.3 Payments

How an Order is paid for, and how the site knows the payment really happened.

| ID | Requirement | Priority |
| --- | --- | --- |
| PAY-01 | Pay online with GCash, Maya or Card through PayMongo's hosted checkout (a payment page PayMongo runs, so card details never touch our site), in Test Mode only. The total shown before paying is final: no fees added on top (research C-22) | M |
| PAY-02 | Pay at Pickup creates the Order with no online Payment; the Barista marks it paid at the counter. Guests may use it for up to 4 drinks; Members for any Order (research C-21, limits no-shows) | M |
| PAY-03 | Payment status comes only from verified webhooks (messages the payment company's server sends ours when a payment changes, checked for a genuine signature), deduplicated on the provider event id (a repeated message is ignored); the browser return page never decides it | M |
| PAY-04 | An online Order unpaid after 15 minutes Expires and frees its Pickup Window | M |
| PAY-05 | The Manager can Refund a paid Order in full; the Customer gets an email | M |
| PAY-06 | A `fake` provider makes the full flow work locally and in demos without a PayMongo account; it refuses to run on a production domain | M |

### 5.4 Accounts and loyalty

Member accounts and the Stars that reward regulars.

| ID | Requirement | Priority |
| --- | --- | --- |
| ACC-01 | Sign in with an email link or Google; the first sign-in creates the Member | M |
| ACC-02 | A Member sees past Orders and can reorder (S) | M |
| ACC-03 | A Member can download and delete their data (the Philippine Data Privacy Act) | M |
| LOY-01 | A Member earns 1 Star per drink in an Order when it is Picked Up (a Reward's free drink earns none); Stars from a Refunded Order are taken back | M |
| LOY-02 | The Star Card shows the balance as 9 spaces and the Rewards available | M |
| LOY-03 | Redeem 9 Stars for a free drink at checkout (one unit of the dearest drink at zero; its Options still add their Price Delta); Stars return if the Order is Cancelled or Expired | M |
| LOY-04 | A Birthday Treat once a year in the Member's birthday month | S |
| LOY-05 | Every Star change is a row in a ledger (a list that is only ever added to) with its reason; the balance is the ledger sum | M |

### 5.5 Events and news

The cafe's calendar and its news articles.

| ID | Requirement | Priority |
| --- | --- | --- |
| EVT-01 | Events page: upcoming Events with date, time, description, photo, price if any; past Events archived | M |
| EVT-02 | Event sign-up with a cap and a confirmation email | S |
| EVT-03 | Recurring Events: a weekly list ("Open mic, Thursdays 7 PM") on the cafe page and the Events page, kept apart from dated Events (research C-52) | S |
| EVT-04 | Add to calendar on each Event page: a calendar file (`.ics`) for Google, Apple and Outlook calendars (research C-32) | S |
| NEWS-01 | Posts page and Post pages with a cover photo, written by the Manager in a simple editor | M |
| NEWS-02 | Home shows the next Event and the latest Post | M |

### 5.6 Staff

What Baristas and Managers can do, so that no developer is needed to run the day.

| ID | Requirement | Priority |
| --- | --- | --- |
| STAFF-01 | Staff sign in with their own accounts; roles Barista and Manager; every Staff action is logged (written to a record of who did what) | M |
| STAFF-02 | Bar Screen: live Orders grouped by Pickup Time, a sound and highlight for new Orders, one-tap moves through Order Status, large targets for a tablet. Scheduled Orders move into "make next" at Pickup Time minus Prep Time (research C-12) | M |
| STAFF-03 | Baristas mark Menu Items and Options Sold Out and back | M |
| STAFF-04 | Managers edit Categories, Menu Items, Option Groups, Options, prices and photos | M |
| STAFF-05 | Managers set Opening Hours, Special Hours, Capacity per day of the week, and Ordering Paused | M |
| STAFF-06 | Managers write Events and Posts | M |
| STAFF-07 | Managers issue Refunds and see a day's Orders and totals | M |
| STAFF-08 | Reports: sales by day, top Menu Items, Stars issued and redeemed | S |
| STAFF-09 | Managers edit the cafe's details: neighbourhood, map pin, directions, email, Amenities, the space paragraph and the story | M |
| STAFF-10 | Managers give and take Staff roles (Barista, Manager) by the email someone signed in with, see the team, and sign a person out everywhere; a Manager cannot change their own role, so one Manager always stays; taking a role away signs the person out | S |

## 6. What makes Hoshikopi different

Five ideas set Hoshikopi apart from a template cafe site. Each one is a promise the build keeps.

1. **Honest pickup times.** Prep Time and Capacity per Pickup Window mean "ready in 8 minutes" is true, and a full window is never offered.
2. **A menu that feels like the cafe.** A distinct visual identity (night sky and coffee: "star coffee") instead of a template, still fast on a phone. It follows the cafe's clock: cream paper by day, night sky from 6 PM (ADR 0010).
3. **Stars that are simple.** One Star per drink, nine for a free one: a paper stamp card, online.
4. **A Bar Screen built for wet hands.** Big targets, one tap per step, a clear "make next" order.
5. **Portfolio-grade engineering.** Money as integer centavos (whole numbers, so nothing rounds wrong), server-side pricing (the server works out every price, never the browser), verified webhooks, tests for every rule, documented decisions.

## 7. Non-functional requirements

These rules say how well the site must work, not what it does: speed, accessibility, security, privacy. A feature that works but is slow, unreadable or unsafe still fails them.

| Area | Requirement |
| --- | --- |
| Performance | Menu and cafe pages prerendered (built ahead of time); mobile Lighthouse performance 90 or more and LCP (largest contentful paint: how long until the biggest thing on screen appears) under 2.5 s on the menu; Bar Screen updates within 5 seconds |
| Accessibility | WCAG 2.2 AA in both the Day and the Night palette; full keyboard use; works at 200% text size; every animation respects reduced motion (a phone or computer setting that asks for no movement) |
| Security | Server-side pricing; verified, idempotent webhooks (processing the same message twice has the same effect as once); rate limits (a cap on tries per person) on sign-in and checkout; strict security headers (instructions that tell the browser what a page may load); Staff routes behind role checks |
| Privacy | Data Privacy Act (RA 10173) basics: a privacy notice, consent for marketing emails, data export and deletion; collect only what an Order needs |
| Reliability | Order Status transitions are explicit and tested; an expired or failed payment never leaves a Pickup Window taken |
| Time | Store UTC (the world standard clock), show Manila time; Pickup Windows and Opening Hours are defined in Manila time |
| Content | Customer copy is plain, warm, Filipino-English where natural; no em dashes in UI copy |
| Concept | The Concept Notice is always visible; no real money can be taken (Test Mode only on every environment) |

## 8. Success metrics

These five targets say how we know the project worked. They were measured on 2026-11-14 in the Phase 9 review; the results and the way each was measured are in [METRICS.md](METRICS.md).

1. End-to-end order in under 60 seconds in a Playwright run (Playwright drives a real browser the way a person would) on a throttled phone profile (a test that slows the computer and the network down to a mid-range phone's speed).
2. Mobile Lighthouse performance 90 or more on Home and the menu; zero axe violations (axe is a free tool that finds accessibility mistakes in a page) on every page.
3. Every price, Reward, Capacity and Order Status rule covered by a test that fails without it.
4. A two-minute demo script ([DEMO-SCRIPT.md](DEMO-SCRIPT.md)): order as a Guest, pay in the Test Mode checkout, watch it move on the Bar Screen, collect a Star as a Member.
5. A case-study write-up in `docs/` ([CASE-STUDY.md](CASE-STUDY.md)) with the decisions (ADRs, the short records of why a choice was made, in [docs/adr/](adr/)) and the numbers.

## 9. Risks and open questions

This section lists what could go wrong or is still undecided, with the plan for each. Status on 2026-11-17: none of these blocks the demo.

| Topic | Risk or question | Plan |
| --- | --- | --- |
| Photos | Concept images are still to be generated (`docs/ASSETS.md`); real photos are on hold (owner, 2026-11-07) | Stand-in panels until then (ADR 0012) |
| PayMongo account | PayMongo paused new sign-ups (November 2026), so there are no test keys and no account was ever set up | The demo stays on the `fake` provider (PAY-06, ADR 0003 update) |
| Realtime | Bar Screen and status page need near-live updates on serverless hosting (hosting that runs code only when a request arrives, so it cannot hold a connection open) | Polling (asking the server again every few seconds) first; revisit Server-Sent Events (the server pushes changes down an open connection) if needed (`docs/03-ARCHITECTURE.md`) |
| Email sender | Resend (the email service) is not set up: its test sender reaches only the owner's own address until a domain is verified | Resend is skipped until a domain exists; visitors sign in with Google (`docs/07-ROADMAP.md` section 4) |
| Design direction | "Star coffee" could tip into a theme park | Direction chosen (ADR 0010) and built with native elements and CSS (ADR 0011) |
| Becoming real | A real cafe would need a business, BIR receipts (the tax authority's official receipts), Internet Transactions Act duties, live PayMongo keys, real photos, the senior citizen and PWD discount (RA 9994, RA 10754, JMC 01-2022: 20% off plus VAT exemption, online orders included) a paid database plan with longer backups, Vercel Pro (Hobby is for non-commercial use; Pro adds finer cron and longer logs) and error monitoring (audit ops:19) | Out of scope; listed so nothing in the build blocks it. The discount needs an ADR beside ADR 0002 (VAT-exempt pricing) and real ID numbers, which a no-money concept should not collect (ADR 0006); the /cafe FAQ says how it would work at the counter |
