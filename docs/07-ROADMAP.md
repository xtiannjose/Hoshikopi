# Roadmap and build plan

Status: draft v0.1, 2026-10-30. The order the site is built in. Each phase has small batches (one branch each) and exit criteria that must be observably true before the next phase starts. Scope is `docs/01-PRD.md`; requirement IDs (MENU-01, ORD-03...) link the two. Weeks are estimates for one developer working part time; dates move, the order does not.

## 0. Where we are (updated 2026-10-31)

- **Planning: done.** `GLOSSARY.md`, PRD, research, architecture, data model, design system, setup, tooling and ADRs 0001 to 0010 are written. Added 2026-10-30: the cafe as a place (research Part 2, PRD INFO-04 to INFO-11) and the design direction (ADR 0010: Night layout, Day and Night palettes by Manila time).
- **Wireframes:** Day and Night canvases with the same boards (`docs/05-DESIGN-SYSTEM.md` section 1.2). Twelve boards each: Home (laptop and phone), Hoshi Latte, Visit page, Cart and checkout, Order status, Star Card and account, Events, a Post, About this concept, Bar Screen, Manager pages (Today, Menu, Hours and capacity). Not wireframed: the other `/manage` forms and V1 features.
- **Build:** Phases 0 to 4 done (3.4 skipped until a PayMongo account exists); batches 5.1 to 5.3 done; 5.4 prepared and waiting for the owner's Neon, Vercel and Resend accounts. Batches 6.1 and 6.4 done; 6.5 dropped (English only). 6.8, 6.6, 6.7, 6.9 and 6.2 done. **Next: 6.3** (Promos and seasonal Menu Items).
- **Copy:** the project is on GitHub (https://github.com/xtiannjose/Hoshikopi) with a git bundle on Google Drive as the backup (`docs/06-SETUP.md` section 8).

## 1. Timeline at a glance

| Phase | What | Estimate | Releases |
| --- | --- | --- | --- |
| 0 | Foundation | 1 week | |
| 1 | Menu and cafe info | 1.5 weeks | |
| 2 | Cart, checkout, Pay at Pickup, Bar Screen | 2 weeks | |
| 3 | Online payments (Test Mode) | 1 week | |
| 4 | Members and Stars | 1 week | |
| 5 | Events, news, polish and demo deploy | 1.5 weeks | **MVP** |
| 6 | V1 features | 2 weeks | **V1** |
| 7 | Portfolio review and case study | 0.5 week | |

## 2. Tech stack and where it is used

| Layer | Choice | Phase | Decision |
| --- | --- | --- | --- |
| App | Next.js 16 (App Router, Cache Components), React 19, TypeScript | 0 | [ADR 0001](adr/0001-modular-monolith-nextjs.md) |
| Styling | Tailwind CSS 4, tokens in `globals.css`, shadcn only when native elements fall short | 0 | `docs/05-DESIGN-SYSTEM.md` |
| Data | PostgreSQL with Prisma; Docker locally, Neon (Singapore) when hosted | 0, 5 | [ADR 0004](adr/0004-postgres-prisma-neon.md) |
| Auth | Better Auth: email link, Google; Staff roles and TOTP | 0, 4 | [ADR 0005](adr/0005-better-auth-members-and-staff.md) |
| Payments | `PaymentProvider` interface; `fake` and PayMongo (Test Mode only) | 3 | [ADR 0003](adr/0003-payments-paymongo-test-mode.md) |
| Email | Resend (terminal output until a key exists) | 2 | Roadmap batch 2.6 |
| Hosting | Vercel Hobby (deploys from GitHub), Vercel Blob for photos | 5 | Decided in batch 5.4 |
| Tests | Vitest (real test database), Playwright with axe, Lighthouse | 0 | `docs/03-ARCHITECTURE.md` section 15 |

## 3. How every batch is worked

1. Read the phase below and `CLAUDE.md`; pick the first unchecked batch; create its branch (`feature/<phase>.<batch>-<name>`).
2. Build. Money, Capacity, Stars and Order Status rules go test-first with the `tdd` skill.
3. `npm run qa` must pass; add `npm run test:e2e` for anything visible. Look at the change in the browser at 375, 768 and 1280 px, in the Day and the Night palette.
4. Tick the batch here, update any document the change affected, add an ADR if a decision was made.
5. Commit, push and open a pull request into `main` only when the user asks (Conventional Commits); the user merges it on GitHub with a merge commit. Refresh the Google Drive bundle only when the user asks.

## 4. Decisions due along the way

| When | Decision | Recorded in |
| --- | --- | --- |
| Batch 1.1 | Build approach for the chosen direction (ADR 0010): Sample A (native and CSS) or Sample B (library parts) | New ADR; `docs/05-DESIGN-SYSTEM.md` updated |
| Batch 1.2 | Menu photos: stock, own photos or AI-generated, and their labelling | New ADR; `docs/ASSETS.md` |
| Batch 2.1 | Capacity and Prep Time defaults (drinks and food per window, minutes per drink) | Seed data and `docs/04-DATA-MODEL.md` |
| Batch 2.6 | Domain for the email sender (`MAIL_FROM`) and the contact address the footer shows (PRD section 2) | `docs/06-SETUP.md` section 5; PRD section 2 |
| Batch 3.1 | PayMongo account: create one for test keys, or stay on `fake` for the MVP | ADR 0003 updated |
| Batch 4.1 | Star rules confirmed (1 per drink, 9 for a Reward) | PRD section 2 |
| Batch 5.4 | Hosting the demo: Vercel Git deploys from GitHub, or another host | New ADR |

## 5. Phase 0: Foundation (1 week)

Goal: an empty but real app with the database, auth skeleton, design tokens and quality gates in place.

- [x] **0.1 Scaffold.** Next.js into this folder (`docs/06-SETUP.md` section 3); remove defaults; `AGENTS.md` block kept; `.env.example`; `npm run dev` works. Done 2026-10-31 with Next.js 16.4.3 and React 19.3; the scaffold already turns on `cacheComponents`.
- [x] **0.2 Quality gates.** ESLint (with the module-boundary import rule), Prettier, TypeScript strict, Vitest, Playwright with axe, the `qa`, `qa:full` and `test:e2e` scripts; one passing test of each kind. The type check runs `next typegen` first: `LayoutProps` and route types are generated. Done 2026-10-31: Vitest 5 (needs `@types/node` 24), Playwright 1.64 at 375 and 1280 px; the unit test proves the boundary rule; `qa` audits production dependencies only (the 16 moderate advisories are in ESLint's dev-only `minimatch`).
- [x] **0.3 Database.** Docker Postgres (section 6 of setup); Prisma schema for every table in `docs/04-DATA-MODEL.md`; first migration with the CHECK constraints; seed data; test database guard. Done 2026-10-31 with Prisma 7.10.1 and `@prisma/adapter-pg`: every MVP table; the V1 tables (`inquiries`, `recurring_events`) wait for Phase 6 and `two_factors` for batch 0.5; the migration adds the CHECKs, allowed badge and allergen values, and a trigger that keeps `order_events` append-only; `payments.checkout_url` added for the redirect.
- [x] **0.4 Modules and money.** `src/modules/*` folders with `index.ts`; `lib/money.ts` (centavos, formatting `PHP 165`); `lib/clock.ts` (Manila time, freezable in tests); tests first. Done 2026-10-31: `formatPrice` (menu) and `formatReceipt`, `vatPart` (12/112, half up), `now()` with `freezeClock`, `manila()` and `manilaInstant()` on the fixed UTC+8 offset.
- [x] **0.5 Auth skeleton.** Better Auth with email link (link printed to the terminal until Resend), Staff roles, `requireStaff`, `audit()`; seeded Manager and Barista can sign in to an empty `/manage`. Done 2026-10-31 with Better Auth 1.7.10: links go to the terminal and `data/mail/` (the end-to-end tests read them there); our Server Action limits links to 3 per email and 30 per IP every 15 minutes; Better Auth's own link-check limit is raised to 60 a minute per IP, as in Hoshimono. Staff TOTP waits for batch 5.3.
- [x] **0.6 Layout and tokens.** Fonts, colour tokens, header with Cart button, footer with the Concept Notice (linking to `/concept`), the neighbourhood and email but no phone or social links, Day and Night palettes switched by Manila time with an Auto, Day, Night switch (ADR 0010), security headers; the static `/concept` page (INFO-10); the site-wide share image (INFO-09). Done 2026-10-31: tokens in `globals.css` with `[data-theme="night"]`; the theme script re-checks the clock every minute; the phone menu is a native popover; security headers without the full CSP (batch 5.3); share image drawn with `next/og` in Fraunces; the Day grain is a 3.7 kB tile (`docs/ASSETS.md`).

**Exit criteria:** `npm run qa:full` green; a seeded Manager signs in and sees `/manage`; the home page shows the header, footer and Concept Notice at 375 and 1280 px with zero axe violations.

## 6. Phase 1: Menu and cafe info (1.5 weeks)

Goal: a beautiful, fast menu and cafe page that a Manager can edit.

- [x] **1.1 Design direction.** Done 2026-10-31 without the two samples: the owner asked for the site to be built straight through, so Sample A (native elements and CSS) was recorded as the approach ([ADR 0011](adr/0011-native-elements-and-css.md)); Sample B can still be asked for.
- [x] **1.2 Photos and assets.** Menu photo decision (ADR); `docs/ASSETS.md`; stand-in photos for the seeded menu, each with alt text; 4 to 6 AI-generated room photos of one consistent room, captioned "Concept image" (PRD section 2). Done 2026-10-31 as slots: no image generator was available, so menu and room pictures are AI-generated concept images still to make, with stand-in panels until then ([ADR 0012](adr/0012-concept-images-with-stand-ins.md)); every seeded Menu Item has alt text and `docs/ASSETS.md` lists each slot with its prompt.
- [x] **1.3 Menu pages.** `/menu` by Category, `/menu/item/[slug]` with Option Groups shown (not yet orderable), badges including Barista Pick, Sold Out and Hidden (MENU-01 to MENU-04); the allergen line (MENU-07); the pickup and Dine-in line (INFO-06); Menu Item share cards (INFO-09); prerendered with the `menu` cache tag. Done 2026-10-31: `getMenu` and `getMenuItem` are `"use cache"` with the `menu` tag and an hourly lifetime, so Sold Out (compared with the Manila service day) turns over by itself after midnight; the Option picker shows the running price; ordering arrives in batch 2.2.
- [x] **1.4 Cafe page and home.** `/cafe`: Opening Hours with Special Hours, "open now", map link, directions, the space, Amenities, the FAQ with ordering and Stars questions, story (INFO-01, INFO-04 to INFO-07); Day and Night hero copy (INFO-12); home in the order of `docs/05-DESIGN-SYSTEM.md` section 6: hero with Order ahead and Plan your visit, Barista picks this week, the printed-menu section, the space, visit block (INFO-08); `/manage/cafe` for the cafe's details and Amenities (STAFF-09); CafeOrCoffeeShop structured data (INFO-02, INFO-03). Done 2026-10-31: hours logic in `lib/hours.ts` (shared by the server and the "open now" island, tested); the Home menu's List and Photos switch is two radios and CSS; dynamic routes read `params` inside Suspense, as Partial Prefetching needs; the Star Card, next Event and latest Post join Home in batches 4.3 and 5.1.
- [x] **1.5 Manager: menu.** `/manage/menu`: Categories, Menu Items, Option Groups, Options, prices, photos (local files for now), Hidden, Sold Out; every save revalidates the `menu` tag (STAFF-03, STAFF-04). Done 2026-10-31: Baristas toggle Sold Out for Menu Items and Options; Managers edit Categories, Menu Items (photo upload to `public/menu/`, type checked by its first bytes), Option Groups and Options (one default per single-choice group); every write is audited and calls `updateTag("menu")`; public reads now live one minute (docs/03 section 4).

**Exit criteria:** a Manager changes a price and marks an item Sold Out, and the public menu shows both within seconds; mobile Lighthouse 90+ on `/menu`; zero axe violations.

## 7. Phase 2: Cart, checkout, Pay at Pickup, Bar Screen (2 weeks)

Goal: a Guest orders and pays at pickup; a Barista runs the Order to Picked Up.

- [x] **2.1 Hours, Capacity, Prep Time.** `cafe` module: `isOpen`, Pickup Windows, Capacity per weekday, Ordering Paused, Prep Time formula; Manager pages for hours, Special Hours, Capacity and pause (STAFF-05); tests first. Done 2026-10-31 test-first: `getOrderingDay` (fresh read: hours with Special Hours, Capacity for the weekday, pause, Prep Time settings), `orderingState`, `prepMinutes` and `pickupWindows`, which takes the window counts as an argument because `pickup_window_usage` belongs to `ordering`; windows start once the Order can be ready and end by closing; `/manage/hours` for STAFF-05.
- [x] **2.2 Cart.** Option picker becomes orderable; Cart with merge, edit and remove; Guest cookie; server pricing; Sold Out Lines flagged (ORD-01, ORD-02, ORD-06). Done 2026-10-31 test-first: `menu.priceChoices` checks each choice against its Option Groups and Sold Out and prices it; the Cart stores choices only, merges identical ones by `choice_key`, and prices on every read; the Guest cookie holds a random token whose SHA-256 hash is stored; the header's Cart count streams inside Suspense.
- [x] **2.3 Order Status machine.** `ordering` module: transitions table, `transition()`, `order_events`, Order Codes; every transition tested (section 7 of the architecture). Done 2026-10-31 test-first: `transition()` locks the Order row (`FOR UPDATE`), checks the table by actor, sets the timestamps, gives back window counts on Cancelled and Expired only (so a Refund after a cancel never gives them back twice), and appends `order_events`; a refused move returns `not_allowed` or `reason_required` because a Customer cancel can race a Barista accept; `nextOrderCode` counts per service day with one upsert. Emails, Stars and payment Refunds join the side effects in batches 2.6, 4.2 and 3.5.
- [x] **2.4 Checkout and placement.** Pickup Time picker (ASAP and Scheduled), contact details, Pay at Pickup; `placeOrder` with the window lock; closed and paused refusals; the 15-drink cap and the Guest limit for Pay at Pickup; the Last Order countdown on the hero card and at checkout (ORD-03 to ORD-05, ORD-07, ORD-12, ORD-13, PAY-02). Done 2026-10-31 test-first: `placeOrder` runs in one transaction (pause and hours, server re-pricing against the total the Customer saw, the caps, a `FOR UPDATE` lock on the window's usage row, snapshot Lines, the Order Code, a 32-byte link token stored as its hash, then the Cart emptied); checkout offers ASAP and today's windows with room; the Last Order countdown is a client island on the hero card and server text at checkout. Online Payment Methods wait for Phase 3. The end-to-end tests open the cafe all day with Special Hours, because the server reads the real clock.
- [x] **2.5 Order status page.** `/orders/[id]` with the access token; polling; customer cancel before Accepted; the pickup and Dine-in line (ORD-08, ORD-09, INFO-06). Done 2026-10-31: `/api/orders/[id]/status?t=` answers the Order Status and a version in a few bytes; a client poller asks every 5 seconds (30 once Ready), pauses while the tab is hidden and refreshes the page on a change; the timeline marks the current step, Ready with the gold star; the Customer cancels until Accepted through `cancelByCustomer`.
- [x] **2.6 Emails.** Resend (or terminal output): Order placed, Ready for pickup (ORD-10). Done 2026-10-31: plain-text Order placed (with the receipt, its VAT part and the status link) and Ready for pickup emails, sent after the transaction commits through Resend's REST API when `RESEND_API_KEY` is set, otherwise to the terminal and `data/mail/`; the status link token is now an HMAC of the Order id, so any later email can rebuild it. Decision (section 4): `MAIL_FROM` stays Resend's test sender and the contact address stays `hello@hoshikopi.example` until the owner has a domain; the Manager changes the address in `/manage/cafe`.
- [x] **2.7 Bar Screen.** `/bar` with columns, polling, sound, one-tap steps, mark paid at the counter (STAFF-02); daily cron route and sweep-on-read for expiry. Done 2026-10-31 test-first: `barBoard` (today's live Orders by Pickup Time, unpaid online ones hidden, a version for cheap polls, Scheduled Orders under "Later today" until Pickup Time minus Prep Time) and `expireUnpaid` (on read in the bar, checkout and the Order page, and in `/api/cron/daily`, which checks `CRON_SECRET`); the Bar Screen keeps the Night palette, chimes with the Web Audio API (mute saved per tablet), pulses new cards once, and Managers pause, resume and cancel with a reason. The status page follows Picked Up within 30 seconds, as ADR 0009 says, not 5 as the exit criteria wrote.

**Exit criteria:** in a Playwright run, a Guest orders two customized drinks for a Scheduled Pickup, a Barista moves the Order to Picked Up on `/bar`, and the status page follows every step within 5 seconds (Picked Up within 30, ADR 0009); a full Pickup Window is never offered. Met 2026-10-31 (`tests/e2e/bar.spec.ts`).

## 8. Phase 3: Online payments in Test Mode (1 week)

Goal: GCash, Maya and Card work end to end without any real money.

- [x] **3.1 Provider interface and `fake`.** `PaymentProvider`, the `fake` adapter with `/dev/pay/[id]` and signed webhooks; production refusal (PAY-06). Done 2026-10-31: `PaymentProvider` with `fake` (HMAC-signed events, checkout at `/dev/pay/[id]`) and `paymongo` adapters; `providerFor(env)` refuses a PayMongo key without `sk_test_` and keeps `fake` off production domains (it runs on localhost and `*.vercel.app`). Decision (section 4): no PayMongo account yet, so the MVP runs on `fake`; the PayMongo adapter exists and is unit-tested but has not met a sandbox. The checkout page and webhook route arrive in batch 3.2.
- [x] **3.2 Webhooks.** Signature check, `payment_events` dedupe, Order to `paid`; the return page reads the Order (PAY-03). Done 2026-10-31 test-first: checkout offers GCash, Maya and Card (Test Mode) beside Pay at Pickup; online placement starts the provider checkout after commit; `/api/webhooks/[provider]` hands the raw body to `receivePaymentWebhook`, which verifies, records the event with `ON CONFLICT DO NOTHING` and moves the Order to Paid in one transaction, then emails; the fake checkout at `/dev/pay/[id]` posts a real signed webhook to that route; the Order page shows Finish paying or a failed payment.
- [x] **3.3 Expiry.** Unpaid online Orders Expire after 15 minutes and release their window (PAY-04). Done 2026-10-31: `expireUnpaid` (on read and in the daily cron, batch 2.7) now also marks the Payment expired and closes the checkout at the provider, so a payment that arrives later is ignored.
- [x] **3.4 PayMongo adapter.** Hosted checkout for GCash, Maya and Card with test keys only; the live-key guard (PAY-01). Skipped if the account decision says `fake` only. Skipped 2026-10-31 as the rule says: no PayMongo account yet, so the MVP runs on `fake`. The adapter from batch 3.1 is ready: create a PayMongo account, set `PAYMENT_PROVIDER=paymongo`, `PAYMONGO_SECRET_KEY=sk_test_...` and `PAYMONGO_WEBHOOK_SECRET`, point a webhook for `checkout_session.payment.paid` at `/api/webhooks/paymongo`, and run one test-card payment to confirm the shapes.
- [x] **3.5 Refunds.** Manager full refund, email, Order to `refunded` (PAY-05, STAFF-07). Done 2026-10-31 test-first: `refundOrder` claims the Payment (paid to refunded) before calling the provider so a double click refunds once, records the Refund and moves the Order to Refunded, then emails; Pay at Pickup is refunded in cash with no provider call; `cancelOrder` refunds a paid Order whoever cancels it (the system does it for a Customer, ORD-09); `/manage/orders` shows a day's Orders and totals with Refund and Cancel behind a confirm.

**Exit criteria:** with the `fake` provider (and PayMongo test cards if 3.4 ran), an online Order reaches `paid` only through a verified webhook, a replayed webhook changes nothing, an abandoned payment Expires and frees its window, and a refund completes.

## 9. Phase 4: Members and Stars (1 week)

Goal: regulars sign in, collect Stars and redeem a free drink.

- [x] **4.1 Member accounts.** Email link and Google sign-in; Guest Cart merges on sign-in; order history (ACC-01, ACC-02). Done 2026-10-31: a first email-link sign-in makes the Member; `currentCartOwner` is the Member once signed in and folds in any Guest Cart left in the browser (`mergeGuestCart`, tested); checkout is prefilled and Members Pay at Pickup without the 4-drink limit; `/account` lists past Orders; Guests are offered an account after ordering; Google sign-in shows only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set (untested until keys exist). One-tap reorder is V1 (ORD-11).
- [x] **4.2 Star ledger.** `loyalty` module: earn on Picked Up, reverse on Refund, adjust by Manager; balance as a sum (LOY-01, LOY-05); tests first. Done 2026-10-31 test-first: `transition()` earns 1 Star per drink (Reward Lines excluded) on Picked Up and reverses them on a Refund after Picked Up, in the same transaction; a reverse never takes the balance below zero (Stars already spent stay spent); Managers adjust with a reason at `/manage/stars`, with the Member row locked and an audit row. Also fixed: React 19 resets a form after its action, so checkout and the Stars form now keep what was typed after a refusal; the Manager editors still reset to saved values on an error (batch 5.2).
- [x] **4.3 Star Card and Rewards.** `/account/stars`; redeem 9 Stars at checkout; release on Cancel or Expire (LOY-02, LOY-03). Done 2026-10-31 test-first: a Reward makes one unit of the dearest drink free (its Base Price); its Options still add their Price Delta, as docs/03 section 5 says (the glossary's "any Size" is read as "any Size you choose"). `placeOrder` locks the Member, checks 9 Stars before taking window room and reserves them in the same transaction (two tabs cannot both spend them); the Reward Line earns no Star; Cancelled and Expired Orders release the 9. The Star Card is a nine-star constellation that draws a cup on `/account` and `/account/stars`, with the Star history.
- [x] **4.4 Privacy.** Privacy notice page, marketing opt-in, data export and account deletion (ACC-03). Done 2026-10-31 test-first: `/privacy` notice (Data Privacy Act rights, plainly); Your details on `/account` with a separate marketing opt-in; `/api/account/export` downloads profile, Orders and Star history as JSON; Delete my account de-identifies the Member's Orders (kept for the cafe's records), forgets Stars and the Cart, and anonymises the user and every way back in.

**Exit criteria:** a Member orders three drinks, the Order is Picked Up, the Star Card shows three more Stars; with nine Stars the Member redeems a free drink, cancels, and gets the Stars back. Met 2026-10-31 (`tests/e2e/stars.spec.ts`).

## 10. Phase 5: Events, news, polish and demo deploy (1.5 weeks)

Goal: the MVP is complete, fast, accessible and online as a demo.

- [x] **5.1 Events and Posts.** Public pages, Manager editors with Markdown preview, home sections, Event structured data, Event and Post share cards (EVT-01, NEWS-01, NEWS-02, STAFF-06, INFO-09). Done 2026-10-31: `content` module (plain reads for tests, `"use cache"` wrappers under the `content` tag, saves in Manila time with audit); `/events` with past Events in a `details`, `/events/[slug]` with Event structured data, `/news` and `/news/[slug]`; share cards with the title and date or excerpt; Home gains the example Star Card, the next Event and the latest Post; `/manage/events` and `/manage/posts` with a live Markdown preview (no raw HTML). Photo upload for Events and Posts waits for Blob storage (batch 5.4).
- [x] **5.2 Accessibility and speed pass.** Keyboard-only walkthrough, screen reader spot checks, Lighthouse budgets (`docs/05-DESIGN-SYSTEM.md` section 11), image weights. Done 2026-10-31: `tests/e2e/quality.spec.ts` checks the JavaScript budget (under 170 kB compressed) on seven public pages, no sideways scrolling at 320 px on ten pages (WCAG 1.4.10; the header's Cart word is screen-reader-only under 360 px), and a keyboard-only path from the skip link through an Option Group to Add to order; Manager editors keep what was typed after a refused save (`useKeptForm`). Lighthouse mobile on this laptop (benchmark index about 1,100, so the default 4x CPU slowdown over-throttles): accessibility, best practices and SEO 100 on Home, menu and a Menu Item; LCP 1.0 to 1.4 s and CLS 0 meet the budget; Performance 86 to 92 and total blocking time 350 to 460 ms miss it. The blocking time is React hydration (the `react-dom` chunk), not app code; halving the RSC payload by turning off `partialPrefetching` did not move it, so the flag stays. Re-measure with PageSpeed Insights on the demo URL in 5.4. Bar poll with nothing changed is 13 bytes; the paper grain is 3.7 kB; menu photos are still stand-ins (ADR 0012), served as WebP at card size by `next/image`, so their weight is checked when the real photos land. Screen reader spot checks (NVDA, VoiceOver) need a person; axe covers names, roles and contrast on every page.
- [x] **5.3 Security pass.** Headers and CSP, rate limits, Staff TOTP, a review of webhook and checkout code (`security-review` skill). Done 2026-10-31: a full Content-Security-Policy locked to this site; scripts need `'unsafe-inline'` because Next's inline RSC scripts on prerendered pages take no nonce or hash (tested: the theme-script hash alone stops hydration; ADR 0013). Rate limits on checkout tries (10 per Cart, 20 per IP, per 15 minutes) and webhooks (120 per IP a minute). Staff Second Factor (TOTP) once per session before `/manage`, checked by `requireStaff()` with our own `two_factors` table, a QR code and 10 tries per 15 minutes; Better Auth's plugin skips email-link sign-ins (ADR 0014). The Bar Screen stays exempt, except a Manager's cancel, which can refund. An independent review of the webhook, checkout, Order link and Second Factor code found: cancelling an unpaid online Order left its checkout payable (now closed, test first), the Bar cancel above, and the fake provider failing open in production without `NEXT_PUBLIC_SITE_URL` or `BETTER_AUTH_SECRET` (now refused). Also fixed: `/orders/[id]` read the clock while Next rendered its shell (`connection()` first). The `security-review` skill reviews a branch against `main`, which still lacks the unmerged batches, so the review ran on the named code instead.
- [ ] **5.4 Demo deploy.** Neon database, Vercel project, Blob for photos, `PAYMENT_PROVIDER` and email settings for the demo; deploy from GitHub (decision in section 4). Prepared 2026-10-31 (still open: needs the owner's Neon, Vercel and Resend accounts): `vercel.json` (migrations before the build, the daily cron at 6:00 AM Manila), the step-by-step checklist in `docs/06-SETUP.md` section 9, and emails on Vercel without Resend are dropped instead of printing sign-in links to the logs. Blob uploads are built when the token exists, so they are tested the day they ship.

**Exit criteria:** every MVP requirement in the PRD is met and ticked; the demo URL works for the two-minute demo script (PRD section 8); `qa:full` green.

## 11. Phase 6: V1 features (2 weeks)

- [x] **6.1 Favourites and reorder** (ORD-11). Done 2026-10-31: Members save a Menu Item with its Options from its page (Guests are asked to sign in) and see them in `/account` priced today, with Add and Remove; each past Order has Order again, which puts its Lines back in the Cart through `addLine` (checked and priced today) and says how many were left out. Order Lines now keep their Option ids (`option_ids`) next to the snapshot; Favourites go with the Cart when an account is deleted.
- [x] **6.2 Event sign-up with a cap** (EVT-02). Done 2026-11-01 (tests first): Events get optional Seats; the Event page shows seats left and a Sign-up form (name, email, 1 to 4 seats, paid at the door), counted under a row lock on the Event so two at once never oversell, one per email per Event, 10 per IP an hour, confirmed by email; the Manager sets Seats in the Event editor and sees the Sign-ups below it. Cancelling a Sign-up is by replying to the email for now.
- [ ] **6.3 Promos and seasonal Menu Items** (time-boxed price changes on Menu Items; `available_until`, MENU-06).
- [x] **6.4 "Order ready" alerts** (ORD-14). Done 2026-11-01: the Order page chimes, vibrates, retitles the tab and shows a browser notification (through a minimal service worker, `public/sw.js`, which Android needs) when the Order turns Ready; "Notify me when it's ready" asks for permission and unlocks the sound; a hidden tab keeps checking every 15 seconds. The installable app (PWA) with push notifications to a locked phone moves after V1 (section 13).
- [x] **6.5 Filipino language.** Dropped 2026-11-01 by the owner: the site stays English only.
- [x] **6.6 Reports and Birthday Treat** (STAFF-08, LOY-04); menu search and dietary filters (MENU-05); Popular this week (MENU-09). Done 2026-11-01 (tests first for Stars): `/manage/reports` for Managers (last 7 or 30 days: sales by Manila day from Picked Up Orders, average Order, top Menu Items, Stars earned, given as Birthday Treats, redeemed, taken back and adjusted, and Orders cancelled, expired or refunded); the Birthday Treat adds 9 Stars once a year in the birthday month (Manila calendar), set in Your details, when the Member opens their account or checkout; Home shows Popular this week once 5 Orders this week had drinks, labelled as demo data; /menu has a search box and Vegan, No caffeine and Nut-free filters that hide cards on the prerendered page.
- [x] **6.7 Recurring Events and Inquiries** (EVT-03, INFO-11); ORD-12 then points to the Inquiry form; add to calendar on Event pages (EVT-04). Done 2026-11-01: a weekly list ("Every week") on `/events` and `/cafe`, edited at `/manage/events/weekly`; `/cafe/inquire` saves an Inquiry (5 per IP an hour), emails the cafe's contact address and lists it at `/manage/inquiries`, where the Manager marks it answered or closed; the Cart, checkout and cafe FAQ point big orders to the form; each Event page has Add to calendar (`/events/[slug]/calendar`, an iCalendar file). Inquiries live in the `content` module, not `cafe` as first planned.
- [x] **6.8 Pairings and Day and Night Barista Picks** (MENU-08, INFO-13). Done 2026-11-01: "Goes well with" on each Menu Item page adds the Pairing in one tap with the defaults its own page starts with (or links there when a required choice is Sold Out); the Manager sets it in the item editor. Day picks (`barista_pick`) and Night picks (`night_pick`), at most three each; Home and the menu's star badge show the current palette's set by CSS, so pages stay prerendered. The migration widens the badge CHECK and sets the seeded pairings and Night picks on databases seeded earlier.
- [x] **6.9 Calorie estimates** (MENU-10). Done 2026-11-01: `menu_items.calorie_kcal` (invented for the seeded menu, set on databases seeded earlier by the migration); the Menu Item page shows "About 260 kcal with the choices it starts with. A concept estimate."; the Manager edits it in the item editor. Estimates follow the default version only, not the chosen Options.

**Exit criteria:** each V1 item works end to end with tests; budgets from Phase 5 still hold.

## 12. Phase 7: Portfolio review and case study (0.5 week)

- [ ] **7.1 Measure.** The success metrics in PRD section 8, written up with numbers.
- [ ] **7.2 Case study.** `docs/CASE-STUDY.md`: the problem, the decisions (ADRs), screenshots, what I would do next.
- [ ] **7.3 Final review.** Code review, accessibility statement, README screenshots, demo script rehearsed.

## 13. After V1 (not scheduled)

The installable app (PWA) with push notifications to a locked phone; more than one cafe; delivery partners; gift cards; loyalty tiers; table QR ordering; real launch requirements (business registration, BIR receipts, Internet Transactions Act duties, live payment keys, real photos and staff).

## 14. Definition of done (every batch)

1. The requirement IDs it covers work end to end in the browser.
2. Rules for money, Capacity, Stars and Order Status have tests that fail without the code.
3. `npm run qa` green (and `qa:full` for anything visible); zero axe violations on touched pages, in both palettes.
4. Words match `GLOSSARY.md`; no em dashes in UI copy; invented details carry the Concept Notice.
5. Docs updated: this roadmap ticked, any changed document edited, an ADR for any decision.
