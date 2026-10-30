# Product Requirements: Hoshikopi

Status: draft v0.1, 2026-10-30. Owner: project lead. Update this document before changing scope. Words follow `GLOSSARY.md`.

## 1. Summary

Hoshikopi is a concept cafe in Metro Manila and the website that runs it. The site sells both the menu and the place: Customers see the room and plan a visit, browse the menu, customize drinks, order ahead and pick up at the counter, pay online (GCash, Maya, Card) or at pickup, collect Stars toward free drinks, and follow the cafe's Events and Posts. Baristas run live Orders from a Bar Screen; the Manager edits the menu, hours and content without a developer.

It is a portfolio project: the cafe, its address and its people are invented and labelled as such (the Concept Notice), and online payments run in Test Mode only. Everything else is built as if the cafe were real, so the site could become a real cafe's site without a rebuild.

**Goals**

1. A Customer can order a customized drink for pickup in under 60 seconds on a mid-range phone.
2. A new Order appears on the Bar Screen within 5 seconds, and a Barista moves it to Ready with one tap.
3. The Manager can change a price, mark a Menu Item Sold Out, set Special Hours or publish an Event without a developer.
4. The site is a portfolio piece: mobile Lighthouse performance 90 or more on the menu, WCAG 2.2 AA, clean code with tests for every money and Order Status rule.

**Non-goals for the first release**: delivery, table reservations, more than one cafe, native mobile apps, real payments, ingredient stock tracking, a point-of-sale system, gift cards, third-party delivery apps.

## 2. Assumptions

Change a row here and every other document should follow. "Invented" rows are shown to visitors with the Concept Notice. "Confirm" rows need a decision before the phase named in `docs/07-ROADMAP.md`.

| Topic | Assumption | Status |
| --- | --- | --- |
| What it is | A concept cafe for a portfolio; no real business | confirmed 2026-10-30 |
| Market | Metro Manila, Philippines | confirmed 2026-10-30 |
| Cafe location | One invented cafe in Kapitolyo, Pasig. The site shows the neighbourhood only, with no street or house number, and the map pin sits on a public spot, so the address can never lead anyone to a real home (research C-54) | invented |
| Contact details | No phone number is shown; questions and large Orders go by email, to an address the owner controls. No social links until the owner runs real accounts (research C-54) | confirmed 2026-10-30 |
| Room photos | AI-generated photos of one consistent room, labelled "Concept image" (research C-43). Menu photos are still decided in batch 1.2 | confirmed 2026-10-30 |
| Look | The Night wireframe's layout; the Day palette from 6:00 AM and the Night palette from 6:00 PM, Manila time; visitors can pin one (ADR 0010) | confirmed 2026-10-30 |
| Locale and time | `en-PH`, Filipino-English voice; Manila time (`Asia/Manila`) | confirm (Phase 0) |
| Currency | PHP, prices include VAT, shown as `PHP 165` (no centavos on the menu) | confirm (Phase 1) |
| Opening Hours | 7:00 to 21:00 daily; orders accepted until 20:30 | invented |
| Fulfilment | Online Orders are pickup only, at the counter. The cafe also takes walk-in Dine-in, with no table bookings (research C-45) | confirmed 2026-10-30 |
| Payment Methods | GCash, Maya, Card through PayMongo in Test Mode; Pay at Pickup | confirm (Phase 3) |
| Loyalty | 1 Star per drink; 9 Stars for a free drink; a Birthday Treat once a year | confirm (Phase 4) |
| Menu size | About 40 Menu Items in 6 Categories, with invented names, prices and stand-in photos | invented |
| Stack | Same as Hoshimono: Next.js 16, TypeScript, Tailwind, PostgreSQL with Prisma, Better Auth, Vercel | confirmed 2026-10-30 |
| Brand name | "Hoshikopi" (hoshi, Japanese for star; kopi, coffee in Malay and Indonesian, close to Filipino kape) | confirmed 2026-10-30 |

## 3. Personas

**Bea, 28, office worker in Ortigas (primary).** Orders her iced Spanish latte on the jeep ride in and wants it ready when she walks in. Pays by GCash. Will not wait in line if the app says "ready in 8 minutes" and it takes 20.

**Migs, 21, student.** Studies at the cafe two afternoons a week, collects Stars, follows open-mic Events. Pays by Maya or at the counter.

**Tita Lorna, 47, family buyer.** Orders a box of pastries and four drinks for the family on Saturday mornings, schedules pickup for 9:00, pays at pickup. Uses a large font size on her phone.

**Jomar, barista.** Works the Bar Screen on a tablet with wet hands and a queue in front of him. Needs big targets, a clear order of what to make next, and a loud cue for a new Order.

**Kai, manager.** Sets prices, marks the croissants Sold Out at 2 pm, adds a latte art night, pauses ordering when the bar is swamped. Non-technical.

## 4. Scope by release

| Release | Contents |
| --- | --- |
| **MVP (Phases 0 to 5)** | Menu with Categories, photos and Option Groups; cafe info (hours, Special Hours, map, the space in photos, Amenities, visit FAQ, story); Home that opens with the room and both "Order ahead" and "Plan your visit"; share cards; an About this concept page; Cart and checkout for As Soon As Possible or Scheduled Pickup with Capacity; Payment Methods GCash, Maya, Card (Test Mode) and Pay at Pickup; Order status page with live updates; Bar Screen; Manager pages for menu, Options, Sold Out, hours, Capacity, Ordering Paused, Refunds; Member accounts (email link, Google); Stars, Star Card and Rewards; Events and Posts; order emails; Concept Notice |
| **V1 (Phase 6)** | Favourites and one-tap reorder; Event sign-up with a cap; Recurring Events; Inquiries for private events and large Orders; time-boxed Promos and seasonal Menu Items; installable app (PWA) with "your order is ready" notifications; Filipino language; reports for the Manager (sales by day, top Menu Items) |
| **Later** | More than one cafe; delivery through partners; gift cards; tiers in loyalty; table QR ordering; a real launch with a real business (see section 9) |

## 5. Functional requirements

Priority: **M** must (MVP), **S** should (V1), **C** could (later). IDs are stable; use them in commits and tests.

### 5.1 Menu and cafe info

| ID | Requirement | Priority |
| --- | --- | --- |
| MENU-01 | The menu lists visible Menu Items by Category with name, photo, short description, Base Price and badges (new, best seller, Barista Pick, contains nuts, vegan) | M |
| MENU-02 | A Menu Item page shows its Option Groups with required and optional choices, Price Deltas, and the running price | M |
| MENU-03 | Sold Out Menu Items and Options stay visible, greyed, with "Sold out today"; they cannot be added | M |
| MENU-04 | The menu works without signing in and is fast on a phone (prerendered; prices and Sold Out update within a minute of a change) | M |
| MENU-05 | Search and dietary filters (vegan, no caffeine, nut-free) | S |
| MENU-06 | Seasonal Menu Items: an optional last day after which the Menu Item is Hidden by itself, built with Promos. Until then the Manager hides them by hand (research C-47) | S |
| INFO-01 | Cafe page: Opening Hours, today's hours with Special Hours applied, "open now" state, the neighbourhood, map link, how to get there, email | M |
| INFO-02 | Structured data for the cafe (CafeOrCoffeeShop with hours, address, Amenities as `amenityFeature`, `smokingAllowed`, `acceptsReservations` false, a room `photo`, `hasMap`) and for Events | M |
| INFO-03 | Concept Notice on every page footer and at checkout, linking to the About this concept page | M |
| INFO-04 | The space: 4 to 6 photos of the room on the cafe page and one on Home, with a short paragraph of concrete facts (seats, light, how it feels by day and by night) (research C-43) | M |
| INFO-05 | Amenities on the cafe page: Wi-Fi, power outlets with a laptop note, pets, smoking, restroom, step-free entrance and accessible restroom, parking with the nearest car park. An Amenity with no value is left out, never guessed. A short visit FAQ answers from the same facts (research C-44, C-51) | M |
| INFO-06 | One line joins pickup and Dine-in on the cafe page, the menu and the Order page: order here for pickup, or walk in and stay (research C-45) | M |
| INFO-07 | Story on the cafe page: origin, a founder note, where the coffee comes from (regions, never a real roaster), the team by first name and role or not at all; every invented person is labelled (research C-48) | M |
| INFO-08 | Home opens with a room photo, today's hours and two actions, Order ahead and Plan your visit; three Barista Picks under "Barista picks this week"; a visit block (neighbourhood, today's hours, directions) within the first two phone screens (research C-42, C-46) | M |
| INFO-09 | Share cards on every public page: Menu Item, Event and Post pages share their own photo with alt text; every other page shares one branded image (research C-49) | M |
| INFO-10 | An About this concept page: what is invented (address, people, prices, photos), what is real (the code, Test Mode payments), and later the case study (research C-55) | M |
| INFO-11 | Inquiry form for private events and large Orders (name, email, date, guests, message), saved for the Manager, who gets an email; Concept Notice on the form (research C-53) | S |

### 5.2 Cart and checkout

| ID | Requirement | Priority |
| --- | --- | --- |
| ORD-01 | Add a Menu Item with chosen Options, quantity and a note to the Cart; identical choices merge into one Line | M |
| ORD-02 | The Cart shows Lines, Options, Line totals and the Order total; edit quantity and Options; remove | M |
| ORD-03 | Choose As Soon As Possible (shows Prep Time) or a Scheduled Pickup in a 15-minute Pickup Window later today, within Opening Hours and Special Hours; the last window is closing time minus Prep Time (research C-09). Ordering for tomorrow is V1 | M |
| ORD-04 | Pickup Windows that are full (Capacity) or past are not offered; the server re-checks Capacity when the Order is placed | M |
| ORD-05 | Guest checkout is the main path: a name and a phone number or email; Members are prefilled. After a Guest's Order, offer an account to keep Stars (research C-15) | M |
| ORD-06 | Prices, Price Deltas, Rewards and totals are recomputed on the server; client totals are never trusted | M |
| ORD-07 | Checkout is refused, with a clear message, when the cafe is closed or Ordering Paused | M |
| ORD-08 | After placing, the Customer sees the Order Code, Pickup Time and an Order status page that updates live (Placed, Paid, Accepted, Preparing, Ready, Picked Up) | M |
| ORD-09 | A Customer can cancel an Order until it is Accepted; a paid Order is Refunded in full | M |
| ORD-10 | Order confirmation and "ready for pickup" emails | M |
| ORD-11 | Favourites and one-tap reorder of a past Order | S |
| ORD-12 | An Order holds at most 15 drinks; larger orders are asked to email the cafe, and to send an Inquiry once INFO-11 exists (research C-14, C-53) | M |

### 5.3 Payments

| ID | Requirement | Priority |
| --- | --- | --- |
| PAY-01 | Pay online with GCash, Maya or Card through PayMongo's hosted checkout, in Test Mode only. The total shown before paying is final: no fees added on top (research C-22) | M |
| PAY-02 | Pay at Pickup creates the Order with no online Payment; the Barista marks it paid at the counter. Guests may use it for up to 4 drinks; Members for any Order (research C-21, limits no-shows) | M |
| PAY-03 | Payment status comes only from verified webhooks, deduplicated on the provider event id; the browser return page never decides it | M |
| PAY-04 | An online Order unpaid after 15 minutes Expires and frees its Pickup Window | M |
| PAY-05 | The Manager can Refund a paid Order in full; the Customer gets an email | M |
| PAY-06 | A `fake` provider makes the full flow work locally and in demos without a PayMongo account; it refuses to run on a production domain | M |

### 5.4 Accounts and loyalty

| ID | Requirement | Priority |
| --- | --- | --- |
| ACC-01 | Sign in with an email link or Google; the first sign-in creates the Member | M |
| ACC-02 | A Member sees past Orders and can reorder (S) | M |
| ACC-03 | A Member can download and delete their data (Data Privacy Act) | M |
| LOY-01 | A Member earns 1 Star per drink in an Order when it is Picked Up; Stars from a Refunded Order are taken back | M |
| LOY-02 | The Star Card shows the balance as 9 spaces and the Rewards available | M |
| LOY-03 | Redeem 9 Stars for a free drink at checkout (the drink Line at zero, Options at their Base Price); Stars return if the Order is Cancelled or Expired | M |
| LOY-04 | A Birthday Treat once a year in the Member's birthday month | S |
| LOY-05 | Every Star change is a row in a ledger with its reason; the balance is the ledger sum | M |

### 5.5 Events and news

| ID | Requirement | Priority |
| --- | --- | --- |
| EVT-01 | Events page: upcoming Events with date, time, description, photo, price if any; past Events archived | M |
| EVT-02 | Event sign-up with a cap and a confirmation email | S |
| EVT-03 | Recurring Events: a weekly list ("Open mic, Thursdays 7 PM") on the cafe page and the Events page, kept apart from dated Events (research C-52) | S |
| NEWS-01 | Posts page and Post pages with a cover photo, written by the Manager in a simple editor | M |
| NEWS-02 | Home shows the next Event and the latest Post | M |

### 5.6 Staff

| ID | Requirement | Priority |
| --- | --- | --- |
| STAFF-01 | Staff sign in with their own accounts; roles Barista and Manager; every Staff action is logged | M |
| STAFF-02 | Bar Screen: live Orders grouped by Pickup Time, a sound and highlight for new Orders, one-tap moves through Order Status, large targets for a tablet. Scheduled Orders move into "make next" at Pickup Time minus Prep Time (research C-12) | M |
| STAFF-03 | Baristas mark Menu Items and Options Sold Out and back | M |
| STAFF-04 | Managers edit Categories, Menu Items, Option Groups, Options, prices and photos | M |
| STAFF-05 | Managers set Opening Hours, Special Hours, Capacity per day of the week, and Ordering Paused | M |
| STAFF-06 | Managers write Events and Posts | M |
| STAFF-07 | Managers issue Refunds and see a day's Orders and totals | M |
| STAFF-08 | Reports: sales by day, top Menu Items, Stars issued and redeemed | S |
| STAFF-09 | Managers edit the cafe's details: neighbourhood, map pin, directions, email, Amenities, the space paragraph and the story | M |

## 6. What makes Hoshikopi different

1. **Honest pickup times.** Prep Time and Capacity per Pickup Window mean "ready in 8 minutes" is true, and a full window is never offered.
2. **A menu that feels like the cafe.** A distinct visual identity (night sky and coffee: "star coffee") instead of a template, still fast on a phone.
3. **Stars that are simple.** One Star per drink, nine for a free one: a paper stamp card, online.
4. **A Bar Screen built for wet hands.** Big targets, one tap per step, a clear "make next" order.
5. **Portfolio-grade engineering.** Money as integer centavos, server-side pricing, verified webhooks, tests for every rule, documented decisions.

## 7. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Performance | Menu and cafe pages prerendered; mobile Lighthouse performance 90 or more and LCP under 2.5 s on the menu; Bar Screen updates within 5 seconds |
| Accessibility | WCAG 2.2 AA; full keyboard use; works at 200% text size; every animation respects reduced motion |
| Security | Server-side pricing; verified, idempotent webhooks; rate limits on sign-in and checkout; strict security headers; Staff routes behind role checks |
| Privacy | Data Privacy Act (RA 10173) basics: a privacy notice, consent for marketing emails, data export and deletion; collect only what an Order needs |
| Reliability | Order Status transitions are explicit and tested; an expired or failed payment never leaves a Pickup Window taken |
| Time | Store UTC, show Manila time; Pickup Windows and Opening Hours are defined in Manila time |
| Content | Customer copy is plain, warm, Filipino-English where natural; no em dashes in UI copy |
| Concept | The Concept Notice is always visible; no real money can be taken (Test Mode only on every environment) |

## 8. Success metrics

Portfolio targets, measured in the Phase 7 review:

1. End-to-end order in under 60 seconds in a Playwright run on a throttled phone profile.
2. Mobile Lighthouse performance 90 or more on Home and the menu; zero axe violations on every page.
3. Every price, Reward, Capacity and Order Status rule covered by a test that fails without it.
4. A two-minute demo script: order as a Guest, pay with a PayMongo test card, watch it move on the Bar Screen, collect a Star as a Member.
5. A case-study write-up in `docs/` with the decisions (ADRs) and the numbers.

## 9. Risks and open questions

| Topic | Risk or question | Plan |
| --- | --- | --- |
| Photos | Menu photos need rights: stock, own shots or AI-generated? Room photos are settled (section 2) | Decide menu photos in Phase 1 (ADR); label stand-ins |
| PayMongo account | Test keys need a PayMongo account | The `fake` provider runs everything until then (PAY-06) |
| Realtime | Bar Screen and status page need near-live updates on serverless hosting | Polling every few seconds first; revisit Server-Sent Events if needed (`docs/03-ARCHITECTURE.md`) |
| Email sender | Order emails need a sending service and a domain | Resend with its test sender until a domain exists |
| Design direction | "Star coffee" could tip into a theme park | Direction chosen (ADR 0010); batch 1.1 still builds two quick prototypes of it, native and with library parts (`docs/05-DESIGN-SYSTEM.md`) |
| Becoming real | A real cafe would need a business, BIR receipts, Internet Transactions Act duties, live PayMongo keys, real photos | Out of scope; listed so nothing in the build blocks it |
