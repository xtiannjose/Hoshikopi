# Research: cafe websites, order-ahead and loyalty

Checked 2026-10-30 14:24 Manila.

Purpose: learn what working cafe sites and ordering platforms do, so Hoshikopi can borrow what works and skip what does not. We take ideas and structure only. We do not copy names, branding, copy, photos or code. Words follow `GLOSSARY.md` (Menu Item, Option Group, Option, Pickup Time, Pickup Window, Star, Star Card, Reward, Bar Screen, Event, Post).

How this was gathered, and its limits: server HTML of each site (saved outside the project), official help centers, developer docs, app store listings, law texts and a few news reports. Read only: no sign-ups, logins, orders or form submissions. Apps were not opened, so in-app flows come from store listings, help articles and the sites' own descriptions. Tim Hortons PH (`timhortons.ph`, `timhortons.com.ph`) refused connections, and no Philippine source was found for The Coffee Bean & Tea Leaf app, so both were dropped. Blue Bottle's website blocks automated reads, so its notes come from its help center and App Store listing. Anything not confirmed at the owner is marked UNVERIFIED.

## Summary

The 10 best ideas, in priority order:

1. **C-09 Pickup Time with Pickup Windows and Capacity.** ASAP ("ready in about N minutes") or a Scheduled Pickup in a 15-minute Pickup Window, same day, last window at closing minus Prep Time. Every order-ahead system checked does a version of this, and Baymard finds pickup timing is usually too vague to commit to [1, 9, 26, 29, 50].
2. **C-02 Option Groups on the Menu Item page.** Size, Milk, Sugar Level, Ice Level, Extra Shots and Add-ons, with each Price Delta shown and a live total. No benchmarked website shows this; it hides inside apps [8, 15, 50].
3. **C-19 PayMongo Hosted Checkout (v2) in Test Mode, confirmed by a verified webhook.** GCash, Maya, Card and QR Ph on one hosted page; the Order becomes Paid only from a signed `checkout_session.payment.paid` event [31, 36].
4. **C-11 Order page with Order Code and live Order Status.** Chains notify "when your order is ready"; on the web this is a status page plus an email [1, 9, 27].
5. **C-12 Bar Screen.** Live Orders by Pickup Time, scheduled Orders surface at Pickup Time minus Prep Time, one tap per status step [29].
6. **C-15 Guest checkout first, account offered after the Order.** 18% of shoppers abandon when forced to sign up [51, 52].
7. **C-20 Expire unpaid Orders.** PayMongo sessions never expire on their own and GCash allows 4 hours, so Hoshikopi must expire them to free Pickup Window room [32, 33].
8. **C-10 Ordering Paused.** One switch for a busy bar, with the resume time shown; Toast and Square both have it [26, 28].
9. **C-34 Opening Hours and Special Hours everywhere.** "Open now, closes 8pm" plus dated Special Hours; no benchmarked site shows dated holiday hours [3, 14, 18].
10. **C-25 Star Card.** 1 Star per drink, 9 Stars for a free drink. Simpler than the tiered points programs at Starbucks PH and Pickup Coffee, and easy to show as 9 spaces [4, 7].

## Candidates

Release key: **MVP** is the first slice that proves order-ahead end to end (menu, cafe info, Cart, payment, Bar Screen). **V1** completes Version 1 (accounts, Stars, Events, Posts). **Later** is after Version 1. **Skip** is not for this concept. Top column: rank among the 10 best.

| ID | Feature | Value | Effort | Release | Reason | Sources | Top |
|---|---|---|---|---|---|---|---|
| C-01 | HTML menu by Category: photo, name, Base Price and one-line description on every Menu Item; no PDF menus | High | M | MVP | Chains hide prices, small cafes use PDFs or photo-less text; users want to start an order from the menu | 2, 8, 15, 18, 53 | |
| C-02 | Option Groups on the Menu Item: Size, Milk, Sugar Level, Ice Level, Extra Shots, Add-ons; required flag, max picks, Price Delta beside each Option, live total | High | M | MVP | Customization is the core of a cafe order and no benchmarked web page shows it | 2, 8, 15, 24, 50 | 2 |
| C-03 | Sold Out shown in place for Menu Items and Options, reset at next opening, toggled from the Bar Screen | High | S | MVP | Stops Orders the bar cannot make; Blue Bottle needs a help article for "is this available at my cafe" | 14, 21, 50 | |
| C-04 | Line note ("less ice please") with a short length limit | Medium | S | MVP | Bo's has a cart-level note; a per-Line note covers requests Options miss | 11 | |
| C-05 | Badges (New, Bestseller, Limited time) and Hidden for off-season Menu Items | Medium | S | V1 | Commune and Pickup lead with these; cheap once the menu exists | 8, 15 | |
| C-06 | Dietary and allergen labels per Menu Item plus a menu filter | Medium | S | V1 | Baymard finds no dietary path on any site; Starbucks PH offers only a disclaimer | 2, 15, 50 | |
| C-07 | Origin and tasting notes on coffee Menu Items | Low | S | V1 | Starbucks PH and Yardstick show them; fits a specialty voice | 2, 14, 17 | |
| C-08 | Calorie count per Menu Item | Low | S | Later | Only with real recipe data, invented numbers would mislead; QC requires it of all food places from 2027-12-21 if real | 2, 49 | |
| C-09 | Pickup Time: ASAP with Prep Time estimate, or Scheduled Pickup in a 15-minute Pickup Window; same day only; last window at closing minus Prep Time; each window has a Capacity for drinks and food Lines; full windows are unavailable and ASAP moves to the next open one | High | L | MVP | Core of order-ahead; Starbucks PH stops 30 minutes before close, Pickup Coffee schedules within the day, Toast and Square tie times to prep and capacity | 1, 9, 10, 18, 26, 28, 29, 50 | 1 |
| C-10 | Ordering Paused: Manager switch with a resume time shown at checkout; menu stays visible | High | S | MVP | Toast snoozes 20 or 40 minutes or rest of day; Square turns pickup off | 26, 28 | 8 |
| C-11 | Order page: Order Code, live Order Status, Pickup Time, cafe directions; email when Ready | High | M | MVP | Every order-ahead app notifies on Ready; a web page plus email does it without an app | 1, 9, 27, 50 | 4 |
| C-12 | Bar Screen: live Orders by Pickup Time; scheduled Orders appear at Pickup Time minus Prep Time; one tap per status step; Sold Out toggles | High | M | MVP | Toast fires orders to the kitchen from prep time; the bar needs one view | 28, 29 | 5 |
| C-13 | Cancellation: Customer may cancel until Accepted; after that only the cafe cancels, with a full Refund | Medium | S | MVP | Starbucks PH allows no cancel once placed; Blue Bottle has a "very small window"; a clear rule avoids disputes | 1, 21 | |
| C-14 | Order size cap (for example 15 drinks); larger orders are asked to call | Medium | S | MVP | Starbucks PH caps mobile orders at 15 items; protects Capacity | 1 | |
| C-15 | Guest checkout as the main path; after the Order, offer an account to keep Stars | High | S | MVP | 18% abandon over forced sign-up; 62% of sites bury the guest option | 51, 52 | 6 |
| C-16 | Order again: Members repeat a past Order in one tap, Sold Out Lines flagged | Medium | S | V1 | Baymard 2026: repeat ordering is undersupported across food sites | 50 | |
| C-17 | Curbside or "I'm here" check-in | Low | M | Skip | Chain feature tied to parking; Hoshikopi is a walk-in city cafe | 1, 3, 26, 27 | |
| C-18 | Native mobile app | Low | L | Skip | Starbucks PH and Pickup Coffee force the app to order; web ordering with no install is the differentiator | 1, 4, 9, 24 | |
| C-19 | PayMongo Hosted Checkout v2 (Checkout Session) for GCash, Maya, Card and QR Ph in Test Mode; `reference_number` set to the Order; Paid only from a signature-verified `checkout_session.payment.paid` webhook, handled idempotently | High | M | MVP | One hosted page covers every Payment Method; the webhook is the only trustworthy signal | 30, 31, 33, 34, 36, 37, 38, 39 | 3 |
| C-20 | Expire unpaid Orders after a short limit (for example 15 minutes): expire the Checkout Session by API, set Expired, free the Pickup Window room, handle the 400 when it was already paid | High | S | MVP | Sessions stay open forever unless expired and GCash allows 4 hours, which would hold Capacity | 32, 33 | 7 |
| C-21 | Pay at Pickup, capped (small Orders or Members only) | Medium | S | MVP | No provider needed, but unpaid no-shows hold Capacity; Starbucks PH requires prepayment | 1, 14 | |
| C-22 | Final total shown before payment with no added fees; do not use `pass_on_fees` | High | S | MVP | Extra costs are the top abandonment reason at 40% | 31, 51 | |
| C-23 | Stored-value wallet and top-up bonuses | Low | L | Skip | Starbucks Card and Pickup top-ups add balances, refunds and reconciliation that a concept does not need | 1, 9, 10 | |
| C-24 | Email receipt for every paid Order, with Order Code and VAT-inclusive prices | Medium | S | MVP | ITA requires invoices or receipts for all sales; PayMongo's own receipt lacks the Order Code | 31, 47 | |
| C-25 | Star Card: 1 Star per drink in a Picked Up Order; 9 Stars buy 1 Reward; shown as 9 spaces; Stars return if a Redemption Order is Cancelled or Expired, and are taken back on Refund | High | M | V1 | Easier to explain than Starbucks PH Star tiers or Pickup Club's 90-day levels | 4, 7, 9, 24 | 10 |
| C-26 | Birthday Treat Reward once a year | Medium | S | V1 | Offered by Pickup Club, Blue Bottle and Yardstick | 7, 19, 22 | |
| C-27 | Passwordless sign-in (email link or code) | Medium | S | V1 | Blue Bottle uses a magic link; Pickup signs up by mobile number; no password to forget | 7, 21, 22 | |
| C-28 | Member tiers and multi-level Reward menus | Low | M | Skip | Starbucks PH (50, 100, 150 Stars) and Pickup Club (4 tiers) need rules a single cafe does not | 4, 7 | |
| C-29 | Gift a drink to a friend | Low | M | Later | Blue Bottle's gifting needs abuse rules (separate accounts, 48-hour support window) | 23, 24, 25 | |
| C-30 | Paid membership or subscription | Low | M | Skip | Yardstick's PHP 199 a month club suits a roaster with retail, not a single cafe | 19 | |
| C-31 | Events list: upcoming first, date, start and end time, price or free, spots left or Full, sign-up link; past Events archived | Medium | S | V1 | Commune's events page shows no dates at all; classes and cuppings are what local cafes run | 14, 16, 18, 19, 20 | |
| C-32 | Event JSON-LD and add-to-calendar file | Low | S | Later | Google's event results are not offered in the Philippines yet | 43 | |
| C-33 | Posts: dated news with photo and excerpt; link to Menu Items mentioned | Medium | S | V1 | Bo's and Yardstick show stale dates; plan a cadence before launch | 6, 13, 17 | |
| C-34 | Opening Hours on every page with an "Open now, closes at" line; dated Special Hours; map link and commute directions | High | S | MVP | Commune shows hours and a commute guide everywhere; no site shows dated Special Hours | 3, 12, 14, 18, 41 | 9 |
| C-35 | JSON-LD `CafeOrCoffeeShop` with address, geo, `openingHoursSpecification` (Special Hours via `validFrom` and `validThrough`), `hasMenu` URL, `servesCuisine`, `priceRange` | Medium | S | MVP | None of the 8 sites marks itself as a cafe; Google uses LocalBusiness data | 5, 6, 14, 17, 20, 41, 42, 44 | |
| C-36 | Google Business Profile with menu and order links | Low | S | Skip | A listing for an invented cafe would mislead real searchers | 45 | |
| C-37 | Store locator with filters | Low | M | Skip | One cafe; locators matter only for chains | 3, 12 | |
| C-38 | Privacy notice, separate unticked marketing consent, account deletion and data download | High | S | MVP | DPA requires informed consent and data subject rights; cheap to build in from the start | 46, 47 | |
| C-39 | Footer facts: business name, address, phone, email, complaints contact, with the Concept Notice | Medium | S | MVP | ITA requires these on an e-retailer's homepage | 47, 48 | |
| C-40 | Accessibility and speed basics: alt text, skip link, zoom allowed, server-rendered menu, sized images | High | S | MVP | Starbucks PH misses alt text on 11 of 12 images; Pickup on 19 of 72 | 5, 6, 11, 14, 17, 20, 53 | |
| C-41 | Delivery and online bean shop with shipping | Low | L | Skip | Version 1 is pickup only; Bo's, Yardstick and EDSA BDG show the extra shipping work | 11, 17, 20 | |

## Patterns that matter

### Menu
- Chains show photos but no prices on the web and send ordering to the app (Starbucks PH, Pickup Coffee) [2, 8]. Small cafes show prices in PDFs (Yardstick, one per cafe) or as text without photos (Commune) [15, 18]. No benchmarked site combines photo, price and Options on one web page.
- Commune is the clearest price model: sizes as 8, 12 and 16 oz prices, and plant milks as Price Deltas (+40 soy, +45 almond, oat and coconut) [15].
- Tags like BESTSELLER, NEW! and LIMITED TIME ONLY! (Commune) and a short Signatures row (Pickup) steer first-time Customers [8, 15].
- Starbucks PH adds an allergen disclaimer, links calorie data for the Quezon City ordinance, and shows growing region and tasting notes on coffees [2].
- MeasuringU (2018): users struggled with unclear category labels and with nutrition menus they could not order from [53].

### Customization
- Apps let Customers customize ("adjust the milk or the size", Blue Bottle; "choose and customize", Starbucks PH) [1, 24]. Web pages describe almost none of it: Pickup only says "Also available hot" [8].
- Baymard 2026: item pages do not describe customization options and there is no path for dietary needs at any step [50].
- Sugar Level and Ice Level: not seen on any benchmarked web page. Apps were not opened, so in-app support is UNVERIFIED.
- Free text: Bo's cart has "Special instructions for seller" [11].

### Order-ahead and pickup
- Starbucks PH: orders from opening until 30 minutes before close, store fixed after submit, max 15 items, no cancel or time change once placed, push notice when ready [1]. Its new app (21 July 2026) launched without Mobile Order & Pay; whether it has returned is UNVERIFIED [4].
- Pickup Coffee: choose branch and time, "schedule your orders for the day", notice when ready [9, 10].
- Yardstick takes online pick-ups at Legazpi only from 9am to 4pm, inside 7am to 8pm cafe hours [18]. Pickup hours narrower than Opening Hours are normal.
- Toast: ASAP cut-off is closing minus prep time; scheduling up to 14 days ahead by default, 0 means same day only; delays add minutes to the quote and guests see only the time; snooze for 20 or 40 minutes or the rest of the day [28, 29].
- Square: automatic pickup times from prep time per order and capacity limits on simultaneous pickups; turn pickup off to pause; email when an order is marked ready; texts on status changes [26, 27].
- Baymard 2026: pickup timing is shown without the detail users need to commit [50].

### Payments
- Starbucks PH Mobile Order & Pay charges the stored Starbucks Card only [1]. Pickup Coffee launched with GCash and Maya (2023) and added card payments and saved methods in 2026 [9, 10]; current GCash and Maya support is UNVERIFIED. Yardstick's footer shows only PayPal [17]. Commune takes orders by Viber or text [14].
- No benchmarked site takes GCash, Maya, cards and QR Ph on the web without an app.

### Loyalty
- Starbucks PH from 21 July 2026: Members choose Rewards at 50, 100 or 150 Stars instead of auto-issued vouchers; the 90-day redemption window starts when a reward is issued [4]. The earn rate (1 Star per PHP 25 in older coverage) is UNVERIFIED for the new program.
- Pickup Club: Bronze, Silver, Gold and Emerald tiers over 90 days (1,500, 6,000 and 12,000 points); 10,000 points for up to PHP 500 off; birthday treats. No earn rate is published [7].
- Blue Bottle: points on every app order, redeemed for a drink "for yourself, or to surprise a friend"; gifts only between separate accounts [23, 24].
- Yardstick: paid club at PHP 199 a month with points, 10% off home coffee, a birthday perk and monthly events [19].
- Pattern: chains are moving to points with tiers and choice. A 9-space Star Card is closer to a stamp card: simpler to explain, build and test. A birthday perk appears in 3 of the 4 programs.

### Events and news
- Commune sells classes as shop products with price and SOLD OUT (for example 3D Latte Art at PHP 1,800) and rents a room for 60 to 100 guests, but its events page lists no dates [14, 16].
- EDSA BDG sells barista training with "Reserve a Slot" [20]. Yardstick runs monthly member events and Flavor Bar reservations [18, 19].
- News goes stale: Bo's latest post is 2025-11-25 and the one before is 2024-01-05 [13]; Yardstick's journal shows 2024 posts [17].

### Store info
- Starbucks PH locator filters by Open Now, 24 hours, Drive-Thru, Curbside and Mobile Order & Pay; no holiday hours [3]. Bo's shows a map with a 5 km radius and addresses only, no hours [12].
- Commune shows hours, address, a Waze link and a "How to commute" page from every page [14]. Yardstick lists hours per cafe; only one cafe states holiday hours [18].
- No site shows Special Hours for a specific date.

### Speed, accessibility and structured data
- No site marks itself as a cafe in JSON-LD. Commune has WebSite, WebPage and BreadcrumbList; EDSA BDG has Organization; Yardstick has Product; Starbucks PH, Pickup and Bo's have none in server HTML [5, 6, 11, 14, 17, 20].
- Images without alt text in server HTML: Starbucks PH 11 of 12, Pickup 19 of 72, Commune 10 of 31 [5, 6, 14]. Bo's, Yardstick and EDSA BDG have skip links [11, 17, 20]. No viewport tag found disables zoom.
- Starbucks PH serves a 28 KB shell and renders in the browser [5].

## Rules and platforms

### PayMongo
- Two paths: Hosted Checkout (Checkout Session; PayMongo hosts the page) or the Payment Intent API (own UI). `/v2/checkout_sessions` is recommended for new work and creates the Payment Intent only when the Customer pays [31]. Payment Intent statuses include `awaiting_payment_method`, `awaiting_next_action`, `processing` (requery, do not assume) and `succeeded` [35].
- Method types: `card`, `gcash`, `paymaya` (Maya), `grab_pay`, `shopeepay`, `qrph` [31, 33]. QR Ph is the BSP national QR standard, payable from many bank and e-wallet apps including GCash and Maya [34].
- Test Mode: `sk_test_` and `pk_test_` keys. Cards: `4343434343434345` Visa success, `4120000000000007` needs 3DS, `4111111111111111` generic decline, `5100000000000198` insufficient funds; any future expiry and any CVC. E-wallets redirect to a test page with Authorize or Fail. QR Ph in test mode makes real codes: do not scan them, use `test_url` [30].
- Session rules: one session yields at most one paid payment; sessions never expire on their own and no webhook fires on expiry; the expire call returns 400 if a payment is paid or ongoing; QR codes expire after 30 minutes while the session stays active [32]. E-wallet authorization windows: GCash 4 hours, Maya 30 minutes [33].
- Webhooks: `checkout_session.payment.paid` carries `reference_number`, `metadata` and the payments [31]; other events include `payment.paid`, `payment.failed`, `payment.refunded` and `qr.expired` [38]. Reply 2xx within 30 seconds; up to 12 retries with backoff; endpoints are per mode [37]. Verify `Paymongo-Signature` (`t`, `te`, `li`): HMAC-SHA256 with the endpoint secret over `t` + `.` + raw body, compare to `te` in test and `li` in live, timing-safe, before parsing JSON [36, 39]. Send `Idempotency-Key` on POSTs [39].
- Fees, as context only (VAT-exclusive, 12% VAT on the fee): cards 3.125% + PHP 13.39, GCash 2.23%, Maya 1.79%, QR Ph 1.34%, no setup or monthly fee [40]. `pass_on_fees` would add the fee to the Customer's total [31].

### Google
- LocalBusiness: required `name` and `address`; recommended `geo` (5 decimals), `openingHoursSpecification`, `telephone`, `url`, `priceRange`, `menu`, `servesCuisine`; use the most specific subtype [41]. Closed all day: `opens` and `closes` both `00:00`; temporary changes use `validFrom` and `validThrough` [41].
- `CafeOrCoffeeShop` is a FoodEstablishment subtype; `hasMenu` supersedes `menu` [44].
- The search gallery (2026-10-16) has Local business and Event, but no Menu or Restaurant feature [42]. Full Menu markup earns no rich result today; a menu URL is enough.
- Event: required `name`, `startDate`, `location` with address; events must be open to the public; the event experience runs in 8 countries plus Latin America, not the Philippines [43].
- Business Profile: a Food ordering section with custom order links, one of which can be marked preferred for pickup; placement varies by country [45].

### Philippine law (relevant if the concept became real)
- **Data Privacy Act (RA 10173).** Lawful bases include consent and contract (Sec. 12). Consent must be "freely given, specific, informed" and recorded (Sec. 3b). Orders and accounts can rest on contract; marketing email needs its own consent. People must be told what is collected, why, who receives it, how long it is kept and who the controller is (Sec. 16b), and can access, correct, block or delete their data (Sec. 16c to 16e) and get a copy (Sec. 18). The controller must secure data and promptly notify the NPC and affected people of certain breaches (Sec. 20f). The exact breach timeline is in NPC rules (UNVERIFIED, not opened) [46].
- **Internet Transactions Act (RA 11967, approved 2023-12-05).** A business selling through its own website is an "e-retailer" (Sec. 4f). Duties (Sec. 23): show prices per Consumer Act Art. 81; publish name, physical address, phone and valid email on the homepage; protect data under the DPA; issue paper or electronic invoices or receipts for all sales; keep an accessible complaint process. 18-month transition (Sec. 32) [47]. Implementing rules (JAO 24-03, 2024) and full enforcement from 2025-06-20 come from news reports: UNVERIFIED, the DTI site was unreachable [48].
- **Quezon City calorie labeling (Ordinance SP-3254 s-2024).** Calorie content on menus, phased: 2025-12-21 for 5 or more branches, 2026-12-21 for 2 or more QC branches, 2027-12-21 for all food establishments in QC; micro businesses exempt. The city page does not address online menus [49].

### UX research
- Baymard 2026 food delivery and takeout benchmark (8 sites, 390+ parameters): no site reaches "decent"; repeat ordering is undersupported; item pages hide customization; no dietary path; pickup timing lacks detail [50].
- Baymard checkout: 18% abandon rather than create an account; 62% of sites fail to make guest checkout the most prominent option [52]. Top abandonment reasons: extra costs 40%, slow delivery 20%, card trust 19%, forced account 18%, long checkout 17% [51].
- MeasuringU (2018, 180 people ordering on 6 chain sites): trouble starting an order, finding a location and reading category labels; separate nutrition menus confused people [53].
- Nielsen Norman Group: no food ordering or pickup study found in this pass.

## Site notes

**Starbucks Philippines** (`starbucks.ph`). Menu with photos, no prices, allergen disclaimer, calorie links and coffee tasting notes; ordering only in the app [2]. Mobile Order & Pay page: store opening to 30 minutes before close, pay from the Starbucks Card, 15-item cap, no cancellation, ready notice [1]. Locator filters by open now and pickup type [3]. New app and choice Rewards (50, 100, 150 Stars) from 21 July 2026, launched without Mobile Order & Pay [4]. Client-rendered shell, no JSON-LD, most images lack alt text [5].

**Pickup Coffee** (`pickup-coffee.com`). App-first chain of 500+ stores on a Next.js site. Web menu has 13 categories, no prices and photos only for 3 Signatures [6, 8]. The app orders for pickup or delivery, schedules within the day and notifies when ready [9]. Paid with GCash and Maya at launch, cards later [9, 10]. Pickup Club has 4 tiers over 90 days and birthday treats [7].

**Bo's Coffee** (`boscoffee.com`). Shopify shop for beans, merch and pastries; drinks go out through FoodPanda and GrabFood, no order-ahead [11]. Locator is a Google map with a 5 km radius and addresses only [12]. News posts are sparse (2025-11-25, then 2024-01-05) [13]. Newsletter gives 10% off; no loyalty program seen [11].

**Commune Cafe + Bar + Roaster** (`commune.ph`, Makati). Best plain-text menu seen: prices, sizes and plant milk Price Deltas [15]. Hours, address, Waze link and commute guide on every page; take-out orders by Viber or text [14]. Coffee University classes sold as products with SOLD OUT; event space for 60 to 100 guests; events page has no dates [14, 16].

**Yardstick Coffee** (`yardstickcoffee.com`). Shopify roaster shop with beans, capsules and gear, journal and brew guides [17]. Cafe page lists 10 cafes with hours and PDF menus; online pick-ups at Legazpi from 9am to 4pm only; holiday hours for one cafe [18]. Paid Coffee Club at PHP 199 a month [19].

**EDSA Beverage Design Group** (`edsabdg.com`). Shopify shop for beans and gear; barista classes with "Reserve a Slot"; cafe orders go through The Grid Food Market's page; studio and stall hours listed, no map [20].

**Blue Bottle Coffee** (global). Website blocked automated reads. App orders ahead from any Blue Bottle cafe with drink customization; points redeem for a drink for you or a friend [24]. Help center covers order cancellation, magic link sign-in, item availability by cafe and cafe hours [21]; 17 membership articles including birthday reward and Gift a drink rules [22, 23]. Loyalty refreshed in 2025 [25].

**Square Online** (platform). Automatic pickup times from prep time per order, how far ahead, and capacity limits; pickup can be switched off; Customers can text "HERE" for curbside [26]. Automatic order emails, an email when marked ready, texts on status changes [27].

**Toast online ordering** (platform). ASAP cut-off at closing minus prep time, scheduling up to 14 days by default, same day with 0 [29]. Delays lengthen the quoted time without telling guests; snooze for 20 or 40 minutes or the rest of the day [28].

## Part 2: the cafe as a place

Checked 2026-10-30 21:24 Manila.

Purpose: Part 1 leaned on bean shops and app-first chains. This part asks how cafe-first sites (a place to be plus a menu) sell the visit, and what Hoshikopi's planning is missing on that side. Same rules: ideas and structure only, no names, branding, copy, photos or code. Words follow `GLOSSARY.md`; new words are listed as proposals in the gaps section, not used as if defined.

How this was gathered, and its limits: each site opened in a real browser (Playwright, Chromium) at 1280 px, reading rendered text, headings, links, share tags and JSON-LD; six Home or store pages measured at 390 by 844 px for where the menu and the visit facts first appear; the full text of 11 pages searched for amenity words (Wi-Fi, laptop, outlet, restroom, smoking, pets, accessibility, parking, reservations). Help pages and specs read through a fetch tool. No screenshots, so layout notes come from the page structure. Read only: no sign-ups, logins, orders or form submissions. Philippine cafes with a working site of their own were hard to find (see Leading with the place), so the Philippine examples are one independent cafe (Rustic Mornings), three small chains (Purple Oven, Mary Grace, Nono's) and % Arabica's Manila store page. Elephant Grounds' Manila franchise has no page of its own that was found. Toast's blog sits behind a bot check. The vendor surveys are US only, not cafe specific, and from 2017 to 2023. Google's attribute help page names only some attribute groups; the full list shows only inside a Business Profile and was not opened. Anything not confirmed at the owner is marked UNVERIFIED.

### Summary

The best ideas, in priority order:

1. **C-42 Home opens with both doors.** A photo of the room, today's hours and two actions: Order ahead and Plan your visit. On a phone, Flora keeps its address and hours in the footer and two Philippine chains leave them off Home entirely [54, 66, 69].
2. **C-43 The space, in photos and words.** The sites that sell a visit best describe the room: size, building, light, seats [61, 63, 64]. Hoshikopi's photo plan covers menu photos only.
3. **C-44 Visit facts.** Wi-Fi, outlets and laptops, pets, smoking, restroom, step-free entrance, parking with the nearest car park. Google Business Profile collects these [75], none of the 10 sites lists most of them, and Hoshikopi will have no profile (C-36), so the cafe page has to carry them.
4. **C-45 Join ordering ahead and staying in one sentence.** The site sells pickup; the cafe sells a seat. "Walk in to dine in, no booking needed" belongs wherever ordering appears.
5. **C-49 Share cards that show the drink.** Cafe-first sites share logos, tiny images or a card titled "Home" [54, 64, 69]; Open Graph asks for alt text with every image [79]. Cheap, and it serves the owner's "people share it" brief.
6. **C-54 Contact details that cannot reach a stranger.** An invented phone number or social handle may belong to a real person. Show invented details as text and link only accounts the owner runs.
7. **C-46 First time here.** Three Signature Menu Items near the top of Home. The architecture promises "featured Menu Items" on Home, but no field picks them.
8. **C-55 About this concept.** The honest stand-in for reviews, press and awards: one page on what is invented and what is real, linked from the Concept Notice.

Not worth it for a concept: reviews or press (C-56), an Instagram feed (C-60), careers (C-61), catering (C-62) and a bring-your-own-cup discount (C-63).

### Candidates

Same columns and release keys as the first table. Top: rank in this part's summary.

| ID | Feature | Value | Effort | Release | Reason | Sources | Top |
|---|---|---|---|---|---|---|---|
| C-42 | Home opens with both doors: a hero photo of the room, today's hours ("Open now, closes 9 PM") and two actions, Order ahead and Plan your visit; a visit block (address, today's hours, directions) within the first two phone screens | High | S | MVP | At 390 px Flora shows its address and hours only in the footer, Nono's and Mary Grace not on Home at all; Rustic Mornings (second screen) and Purple Oven (first screen) answer "where and when" early | 54, 64, 65, 66, 69 | 1 |
| C-43 | The space in photos and words: 4 to 6 photos of the room on `/cafe` (counter, window seats, evening light) and one on Home, plus a short paragraph of concrete facts (seats, size, light, how it feels by day and by night) | High | S | MVP | Kurasu and % Arabica sell each cafe by its room (size, old building, materials, booths), Rustic Mornings by its garden; MGH (vendor survey, 2019): 69% say a website helps them decide whether to dine in | 54, 61, 63, 64, 84 | 2 |
| C-44 | Visit facts on `/cafe`: walk-in dine-in (no reservations), number of seats, Wi-Fi, power outlets and a laptop note, pets, smoking, restroom, step-free entrance and accessible restroom, parking with the nearest car park and walking minutes; each fact edited by the Manager, unknown facts left out | High | S | MVP | These are the facts Google Business Profile collects; Nono's gives parking per store with walking minutes and Mary Grace filters stores by alfresco, function room, kids corner and seats; none of the 10 sites mentions Wi-Fi, outlets, laptops, restrooms or step-free access, though persona Migs studies at the cafe | 67, 70, 71, 75 | 3 |
| C-45 | One sentence that joins ordering ahead and staying ("Order here for pickup at the counter. Staying? Walk in and find a seat; we call your Order Code at the bar.") on `/cafe`, the menu and the Order page | High | S | MVP | The site sells pickup only but the cafe also sells a stay; Mary Grace says plainly it serves dine-in, take-away and delivery; table reservations are a PRD non-goal, so the site should say so | 67 | 4 |
| C-46 | First time here: three Signature Menu Items with one line on why (Hoshi Latte first) near the top of Home, each linking to its Menu Item page | Medium | S | MVP | Rustic Mornings opens its menu with Bestsellers and prices, Flora with fall specials, Mary Grace with its Ube Series; Home lists "featured Menu Items" but `menu_items` has no field to pick them | 54, 64, 66 | 7 |
| C-47 | Seasonal Menu Items with an end date: a "This season" set on Home and the menu, Hidden automatically after the date | Medium | S | V1 | Flora (fall specials), Mary Grace (Ube Series) and Kurasu (a 2026 seasonal blend) all rotate a season; C-05 has a Limited time badge but no end date | 54, 60, 66 | |
| C-48 | Story and people on `/cafe`: an origin story, a founder note, the team by first name and role, where the coffee comes from; every invented person and supplier labelled; photos of hands and backs, not faces | Medium | S | MVP | Flora's founder note, Rustic Mornings' three-generation story, Mary Grace's "how it all began" and Elephant Grounds' coffee program note; ADR 0006 already says the people are invented | 55, 59, 64, 66 | |
| C-49 | Share cards on every public page: `og:title`, `og:description`, `og:url`, `og:type` (`article` for Posts), a 1200 by 630 `og:image` with `og:image:alt`, `twitter:card` set to `summary_large_image`; a Menu Item card shows its photo, name and Base Price | High | S | MVP | Flora's share image is 254 by 174 px, Rustic Mornings shares its logo, Nono's titles its card "Home", Purple Oven has no tags; none of the 8 sites checked sets `og:image:alt`; the owner wants a site people share | 54, 64, 65, 69, 79 | 5 |
| C-50 | Extend the C-35 JSON-LD: `amenityFeature` (name and value pairs from C-44), `smokingAllowed`, `acceptsReservations` set to false, `photo` of the room, `hasMap`; `sameAs` only for real profiles | Low | S | MVP | Cheap once C-44 exists, but Google's local business guide uses none of these and the demo is noindex (ADR 0006); worth it only as correct, complete data | 41, 76, 77, 78 | |
| C-51 | Visit FAQ on `/cafe`, written from the C-44 facts: dining in, reservations, Wi-Fi and laptops, pets, parking, large Orders, ordering for later, accessibility; no FAQPage markup | Medium | S | MVP | Nono's gives pets a full page of rules and Kurasu links a help center; Google retired FAQ rich results in 2026, so the FAQ is for people only | 60, 71, 81 | |
| C-52 | Recurring Events: a short list of weekly moments ("Open mic, Thursdays 7 PM") on `/cafe` and `/events`, kept apart from dated Events | Medium | S | V1 | Flora runs a weekly flower day beside its dated, ticketed Event; the `events` table holds one start and one end | 54, 56 | |
| C-53 | Inquiry form for private events and large Orders (name, email or phone, date, guests, occasion, message), saved for the Manager and answered by email, with the Concept Notice on the form | Medium | M | V1 | Rustic Mornings, Mary Grace (capacity per space, reply within 48 hours), Nono's (function rooms, coffee cart) and Elephant Grounds (catering) all sell group visits; ORD-12 sends big Orders to "call the cafe" with no line to call | 59, 64, 68, 70, 72 | |
| C-54 | Contact details that cannot reach a stranger: the phone shown as text marked invented, not a `tel:` link; email only on a domain the owner controls; no invented social handles; social links and `sameAs` only for accounts the owner runs | High | S | MVP | Most cafe sites checked link Instagram, several Facebook too; an invented handle or mobile number may belong to a real person; C-39 puts phone and email in the footer | 54, 57, 64, 66, 69, 70 | 6 |
| C-55 | An "About this concept" page linked from the Concept Notice: what is invented (address, people, prices, photos), what is real (the code, Test Mode payments), and later the case study | Medium | S | MVP | The honest stand-in for the press pages, awards and review counts real cafes show (Kurasu has a press page and 4,969 shop reviews); Google gives no stars to reviews a business controls | 60, 80 | 8 |
| C-56 | Reviews, testimonials, press quotes or star ratings | Low | S | Skip | All would be invented for a concept; Google treats reviews a business controls about itself as ineligible for stars | 80 | |
| C-57 | "Popular this week" from real Order counts on the demo, labelled as demo data | Low | S | Later | Honest proof once STAFF-08 reports exist; Rustic Mornings' Bestsellers show the appeal; small demo volumes make it noisy | 64 | |
| C-58 | Newsletter sign-up for Guests | Low | S | Later | Flora, Nono's, Kurasu, Escape and Binocle all ask; Members already have `marketing_opt_in`, and a Guest list adds Data Privacy Act duties (C-38) with nothing to send | 54, 57, 58, 60, 69 | |
| C-59 | Neighbourhood guide ("our favourite spots nearby") | Low | S | Later | % Arabica lists six nearby places on its Manila store page; for an invented cafe, naming real businesses implies ties that do not exist; landmarks in directions are fine (C-34) | 63 | |
| C-60 | Instagram feed on Home | Low | M | Skip | No real account; Meta's oEmbed is for front-end display only and skips private accounts; a third-party script works against the performance budget | 82 | |
| C-61 | Careers page | Low | S | Skip | Mary Grace, Kurasu and Elephant Grounds recruit on their sites; a concept would mislead job seekers | 59, 60, 66 | |
| C-62 | Catering or a coffee cart for outside events | Low | M | Skip | Nono's coffee cart and Elephant Grounds' catering are off-site services; Hoshikopi is pickup only | 59, 72 | |
| C-63 | Bring-your-own-cup discount | Low | S | Skip | Not seen on any site checked; a discount needs a negative Price Delta, which the glossary forbids; a scheduled Order is made before the cup arrives | none found | |

### Patterns that matter

#### Leading with the place
- Of the five shortlist sites named as cafe-first, two are bean shops with no cafe content (Binocle, Escape) and three keep their cafes one or two clicks behind a shop or a brand story (Kurasu, Elephant Grounds, % Arabica) [57 to 63]. Flora is the only one that leads with its own cafe and menu [54].
- The best place-selling is plain description of the room: size, building history, materials, seats, light and what is nearby. Kurasu writes a paragraph per store [61], % Arabica names the architect and the materials [63], Rustic Mornings describes its garden and art [64]. No page checked uses a virtual tour or a video of the space.
- At 390 by 844 px: Flora's menu starts about 1,640 px down and its address and hours sit only in the footer, about 6,700 px down a 7,100 px page [54]; Rustic Mornings shows its address about 1,640 px down [64]; Purple Oven shows hours on the first screen [65]; Nono's and Mary Grace show no address or hours on Home [66, 69]. No site has a sticky visit or order button; Mary Grace pins a promo bar for its delivery site [66]. None scrolls sideways.
- Philippine cafes with a working site of their own were hard to find: Coffee Project's Shopify store says it is unavailable, the domain a listing gives for Single Origin is open for registration, and about 15 other guessed domains were parked, unregistered or unreachable [73]. Directory listings for independent Kapitolyo cafes point only to Facebook and Instagram (UNVERIFIED) [74]. A neighbourhood cafe with a good site stands out here.

#### Visit facts
- Across the full text of 11 pages, none mentions Wi-Fi, laptops, power outlets, restrooms, smoking or step-free access [54, 55, 59, 61, 63 to 67, 69, 70]. Only Nono's covers pets (a page of rules) and parking (a line per store) [70, 71]; Mary Grace filters stores by Alfresco Dining, Function Room, Kids Corner and seating capacity [67].
- Google Business Profile is where these facts usually live: owners set attributes such as Wi-Fi, outdoor seats and wheelchair-accessible entrance, restroom, seating, parking and elevator; some come from visitors' answers; availability varies by country and business category [75]. Hoshikopi skips a profile (C-36), so its own cafe page is the only place to learn them.
- The most useful parking line names the nearest car park and the walk ("3 min. walk") [70]. Kurasu's "steps from" a train station is the transit version [61]. Purple Oven and Nono's link branches to a Google Maps search; % Arabica embeds a map [62, 65, 70]. A plain link (C-34) is enough and costs no script.
- Mary Grace states its service modes (dine-in at cafes, take-away, delivery) and says holiday hours may change, so call first [67]. No site explains how ordering ahead relates to sitting down.
- Personas: Migs studies at the cafe two afternoons a week (Wi-Fi, outlets, laptop rules), Tita Lorna brings the family on Saturday mornings (parking, step-free entrance), Christian comes by jeep (commute). No planning doc holds any of these facts.

#### Menu on cafe-first sites
- Prices on the page win: Flora and Rustic Mornings print the menu with prices on Home, and Flora lists add-ons with their price, like Price Deltas [54, 64]. Nono's and Elephant Grounds still use PDFs [59, 69], which C-01 already rules out.
- Every cafe-first site rotates something: fall specials (Flora), an Ube Series (Mary Grace), a seasonal blend (Kurasu) [54, 60, 66]. A start-here set (Bestsellers, a signature line) sits at the top at Rustic Mornings and Mary Grace [64, 66].
- Food pairing: not seen anywhere. Coffee sourcing appears as one line (Elephant Grounds' East Java farm) or as tasting notes on beans for sale (Kurasu) [59, 60]; C-07 covers it.

#### Story and people
- Origin stories are short and personal: a founder who started with a market coffee cart (Flora), a mother and daughter who turned private dining into a garden cafe (Rustic Mornings), a mother baking for village bazaars (Mary Grace) [55, 64, 66]. Teams show up as "join us" pages, not named baristas [59, 60, 66].
- Every Hoshikopi person and supplier is invented (ADR 0006), so the story works only if it is labelled. Naming a real farm or roaster as a supplier would claim a relationship that does not exist.

#### Community, events and groups
- Flora pairs a weekly ritual (a flower day every Friday) with dated, ticketed Events that name the instructor and keep an archive [54, 56].
- Group business is everywhere: a private event form (Rustic Mornings), event spaces with capacity and a reply promise (Mary Grace), function rooms and a coffee cart (Nono's), catering and collaborations by email or WhatsApp (Elephant Grounds) [59, 64, 68, 70, 72]. Commune's event space in Part 1 is the same pattern [16].

#### Sharing and social links
- Share cards are weak on cafe-first sites: Flora's image is 254 by 174 px, Rustic Mornings shares its logo, Nono's card is titled "Home", Purple Oven has no tags [54, 64, 65, 69]. Mary Grace, Escape and Binocle use large images [57, 58, 66]. None of the 8 sites checked sets `og:image:alt`.
- Open Graph requires `og:title`, `og:type`, `og:image` and `og:url`, says `og:image:alt` should accompany an image, and has no place or restaurant type, so cafe pages use `website` and Posts `article` [79].
- Instagram is the usual social link (Flora adds TikTok; Mary Grace and Nono's add Facebook and LinkedIn) [54, 66, 69]. Purple Oven offers only phone, Viber and email [65].

#### Social proof, honestly
- What these sites use as proof: Kurasu's 4,969 shop reviews and press page, Elephant Grounds' Cup of Excellence farm, % Arabica's named architect [59, 60, 63]. The cafe pages themselves mostly show none.
- Google: when a business controls the reviews about itself, its pages are ineligible for review stars, and LocalBusiness review markup is meant for sites that review other businesses [41, 80]. Invented reviews would also break ADR 0006.
- Honest options for a concept: the About this concept page (C-55), real Order counts on the demo labelled as such (C-57), and the case study (Phase 7).

#### What visitors look for (vendor surveys)
All US, none cafe specific, none Philippine. Read them as direction, not numbers to quote.
- MGH, a marketing agency (press release, 2019-08-29, 1,101 US adults who eat out or order at least monthly): 77% are likely to visit a restaurant's website first; 69% say it helps them decide whether to dine in; 45% look for food photos (59% of 18 to 24 year olds); 68% were put off visiting by a website, most often by the menu items (65%), then food photos (36%), hard navigation (33%), hard-to-read menus (30%) and an old look (30%) [84].
- BentoBox (2023-05-17, over 2,000 US diners): 86% research new restaurants online; 75% would pick the one with the better website [83].
- TouchBistro (fielded June 2017, 521 US adults who eat out weekly): 59% look at the online menu and 51% at the website before going; type of food is the top reason to choose (63%) [85].
- Toast's diner survey sits behind a bot check; a figure seen in search results (32% "always" check a website) is UNVERIFIED [86].
- None of these asks about Wi-Fi, seating or pets, and no survey of what Filipino cafe-goers look for was found.

#### Platforms and specs
- schema.org `Place` has `amenityFeature` (a LocationFeatureSpecification: free-text `name`, a `value`, optional `hoursAvailable`), `smokingAllowed`, `publicAccess`, `isAccessibleForFree`, `maximumAttendeeCapacity`, `photo`, `hasMap`, `specialOpeningHoursSpecification` and `event`; `sameAs` comes from Thing [76, 77]. `FoodEstablishment` adds `acceptsReservations` (Boolean, URL or text) [78].
- Google's local business guide lists none of `amenityFeature`, `smokingAllowed`, `acceptsReservations` or `photo`; `image` is required only for a restaurant carousel [41]. Google retired FAQ rich results in 2026 [81].
- Meta's Instagram oEmbed returns embed HTML for front-end display only, skips private accounts and allows 1,000 requests an hour [82].

### Site notes

**Flora Café** (`florawellnesscafe.com`, Modesto, US; the owner's pick). Squarespace. Home runs hero photos (the patio, a cup carried across a crosswalk, a pop-up bar), the full menu with add-on prices and four fall specials, a weekly flower day, the next Event, merch, two Posts and a newsletter, then address, hours and email in the footer [54]. About has a founder note on starting as a market coffee cart and pop-up, now on a restaurant's patio [55]. Events show date, time, instructor, a ticket link and an archive [56]. No order-ahead, map, parking, Wi-Fi, pets, FAQ or reviews. Share image 254 by 174 px; LocalBusiness JSON-LD with name, address and image only; 5 of 50 images without alt [54].

**Café Binocle** (`cafebinocle.com`, Quebec). Shopify micro-roaster in French: subscriptions, artist collaborations, "where to find us", newsletter, a collaboration email. No cafe visit content [57].

**Escape Coffee Company** (`escape.cafe`, Montreal). Shopify roaster: beans by roast series, subscriptions, wholesale, equipment repair; one lab address in the footer. Large share image and Organization JSON-LD [58].

**Elephant Grounds** (`elephantgrounds.com`, Hong Kong; franchise in Manila). A food-photo hero with no headline, the story (2013, Manila franchise), a coffee program from an East Java farm, shop products on a partner site, pastries "made from scratch in-house", events and collaboration by email and WhatsApp, one store with hours and a PDF menu, a roastery with no address, catering and careers by email, app badges [59].

**Kurasu** (`kurasu.kyoto`, Kyoto). Home is a bean and gear shop with 4,969 shop reviews and links to press, careers, wholesale and a help center; 99 of 122 images have empty alt [60]. The stores page is the best "sell the room" writing seen: a paragraph per store on size, building and neighbourhood (a 28 m² first shop, a townhouse roastery open to the public once a month, a former photo studio steps from a train station), each with a Google Maps link and no hours [61].

**% Arabica** (`arabica.com`, global; two Manila cafes). Home is a full-screen image with five links. Locations go region, country, city, store, over an embedded map [62]. The Manila BGC Roastery page tells the design story (architect, stone facade, brick interior, booths) and lists six favourite spots nearby; no hours appeared in the rendered text [63].

**Rustic Mornings** (`rusticmornings.com`, Marikina; independent). One-page Squarespace site: a "come home" welcome, the family story, three phone numbers, address and hours on the second phone screen, Bestsellers and drinks with prices, a bakeshop link and a private event form (occasion, date, guests). LocalBusiness JSON-LD; the share image is the logo; footer year 2019 [64].

**Purple Oven** (`purpleoven.com.ph`, Metro Manila bakery cafe). One short page: a line on baking with real butter, a menu link, hours by region, branches as Google Maps search links, landline and Viber. No share tags or JSON-LD [65].

**Mary Grace Cafe** (`marygracecafe.com`, Philippine cafe chain). Home: What's New (openings, the Ube Series), celebration cakes, the founder's story; ordering on a separate delivery site; careers [66]. Locations filter by store type, services and seating capacity and say to call a branch before dropping by on holidays [67]. Event spaces list each branch's capacity and hours with an inquiry button and a 48-hour reply promise [68].

**Nono's** (`nonos.ph`, Metro Manila restaurant and bakery). Home: comfort food and bakery, PDF menus (kitchen, bakery and beverages, party platters), "book us for your next event", What's New and a newsletter with a plain opt-in sentence [69]. Stores list hours per day, a phone and a parking note per branch, and flag function rooms [70]. A pet policy page [71] and a coffee cart for weddings and company events [72].

### Gaps in the planning docs

The pattern behind the gaps: the planning docs treat `/cafe` as hours plus "about". What a visitor weighs before coming in (the room, seats, Wi-Fi, pets, parking, access, how pickup and staying fit together) has no requirement, field, component or batch. Only candidates worth taking (MVP and V1) are listed; Later and Skip candidates change no document now.

**Applied 2026-10-30 (owner's picks).** The docs now carry these candidates, with four differences from the table below: Amenities are fixed columns on `cafe_settings`, not an `amenities` table; room photos are static files, not `cafe_photos`; C-46 is the Barista Pick badge ("Barista picks this week"), not `featured_sort` or a Signature; no phone is shown at all, and the address stops at the neighbourhood.

| Candidate | Document and section | Change |
|---|---|---|
| C-42 | `docs/03-ARCHITECTURE.md` section 4, `/` row | Add the visit block (address, today's hours, directions) and the two actions to Home's contents |
| C-42 | `docs/05-DESIGN-SYSTEM.md` section 6 | New Visit block component; a Home section order: hero with the room, first-time picks, printed menu, the space, next Event, latest Post, visit block |
| C-43 | `docs/01-PRD.md` section 5.1, INFO-01 | Add "photos and a short description of the space" |
| C-43 | `docs/07-ROADMAP.md` batch 1.2; `docs/05-DESIGN-SYSTEM.md` section 8 | The photo decision and `docs/ASSETS.md` cover room photos as well as menu photos; imagery guidance for the room (evening light, window seats, empty or hands only) |
| C-43 | `docs/04-DATA-MODEL.md` section 3, Cafe | New `cafe_photos` (`id`, `url`, `alt`, `sort`), or static files if the Manager never edits them |
| C-44 | `docs/01-PRD.md` INFO-01 and STAFF-05 | Visit facts on the cafe page; Managers edit them |
| C-44 | `docs/04-DATA-MODEL.md` section 3, Cafe | New `amenities` table (`key` PK, `value` bool null, `note` text, `sort`) with keys such as `wifi`, `outlets`, `pets`, `smoking`, `step_free_entrance`, `accessible_restroom`, `parking`; or fixed columns on `cafe_settings` |
| C-44 | `docs/03-ARCHITECTURE.md` section 4, `/cafe` row | Amenity edits revalidate the page (the `hours` tag, or a new `cafe` tag) |
| C-44 | `docs/05-DESIGN-SYSTEM.md` section 6 | Visit facts list: icon, label, short note; a fact with no value is left out, never guessed |
| C-44 | `GLOSSARY.md`, Cafe and content | Proposed word Amenity |
| C-45 | `docs/01-PRD.md` section 5.1; `docs/05-DESIGN-SYSTEM.md` section 8 | A requirement that `/cafe`, the menu and the Order page explain pickup and walk-in dine-in; the sentence goes into the copy rules; proposed word Dine-in |
| C-46 | `docs/04-DATA-MODEL.md` section 3, `menu_items` | A field that picks Home's featured Menu Items (`featured_sort` int null, or a `signature` badge); the architecture already promises "featured Menu Items" with no field behind it; proposed word Signature |
| C-47 | `docs/04-DATA-MODEL.md` section 3, `menu_items`; `docs/07-ROADMAP.md` batch 6.3 | `available_until` date null that hides the Menu Item after the date; built with Promos |
| C-48 | `docs/01-PRD.md` INFO-01; `docs/07-ROADMAP.md` batch 1.4 | Spell out "about the cafe": origin story, founder note, team, coffee source, each labelled as invented |
| C-49 | `docs/01-PRD.md` section 5.1 | New INFO-04: share cards on every public page |
| C-49 | `docs/03-ARCHITECTURE.md` section 14 | How share images are made (a file per route, or generated from the Menu Item photo) and cached; read the metadata guide in `node_modules/next/dist/docs/` first |
| C-49 | `docs/07-ROADMAP.md` batches 1.3, 1.4 and 5.1 | Share cards in each public page's scope |
| C-50 | `docs/01-PRD.md` INFO-02 | Add the amenity, smoking, reservation and photo properties |
| C-51 | `docs/01-PRD.md` INFO-01; `docs/07-ROADMAP.md` batch 1.4 | A visit FAQ on `/cafe` built from the visit facts |
| C-52 | `docs/04-DATA-MODEL.md` section 3, Content; `docs/01-PRD.md` EVT-01; `GLOSSARY.md` Event | A `recurring_events` table (`title`, `weekday`, `starts_at`, `ends_at`, `note`, `is_published`) or a weekday rule on `events`; an S requirement; proposed word Recurring Event |
| C-53 | `docs/01-PRD.md` sections 5.2 and 5.5 | New S requirement for an Inquiry, linked from ORD-12 and the Events page |
| C-53 | `docs/04-DATA-MODEL.md` section 3, Content; `docs/03-ARCHITECTURE.md` section 4 | An `inquiries` table (`kind`, name, contact, date, guests, message, `status`); routes such as `/cafe/inquire` and `/manage/inquiries`; rate limits and the privacy notice cover it |
| C-53 | `docs/07-ROADMAP.md` section 11; `GLOSSARY.md` | A Phase 6 batch; proposed word Inquiry |
| C-54 | `docs/01-PRD.md` section 2; `docs/05-DESIGN-SYSTEM.md` section 6 | A new Assumptions row: the phone shown as invented text, not a `tel:` link; email only on the owner's domain; no social links until real accounts exist. The footer follows it. Fits ADR 0006 as written, so no new ADR |
| C-55 | `docs/03-ARCHITECTURE.md` section 4; `docs/05-DESIGN-SYSTEM.md` section 6, Concept Notice; `docs/07-ROADMAP.md` batches 0.6 and 7.2 | A new prerendered route (for example `/concept`); the Concept Notice links to it; the case study link is added in 7.2 |

Proposed glossary words (not yet defined; add to `GLOSSARY.md` before any code uses them):

- **Amenity**: a fact about the cafe as a place to stay (Wi-Fi, power outlets, pets, step-free entrance, parking), shown on the cafe page. _Avoid_: feature, attribute (in UI copy).
- **Dine-in**: eating or drinking at the cafe after walking in; not ordered through the site in Version 1. _Avoid_: for here (in code), table service.
- **Signature**: a Menu Item the cafe suggests to first-time Customers; at most three at a time.
- **Recurring Event**: something that happens at the cafe on the same weekday and time every week, with no sign-up.
- **Inquiry**: a Customer's request about a private event or a large Order, answered by the Manager by email.

## Sources

1. https://starbucks.ph/order - Starbucks PH Mobile Order & Pay page. Undated (footer 2022). Order window, Starbucks Card payment, 15-item cap, no cancellation, ready notice, in-store or curbside.
2. https://www.starbucks.ph/menu - Starbucks PH menu. Photos, no prices, "standard Tall recipe" note, allergen disclaimer, QC calorie ordinance link, tasting notes, menu search.
3. https://starbucks.ph/stores - Starbucks PH locator. Open Now, 24 hours, Drive-Thru, Curbside, Mobile Order & Pay filters; no holiday hours.
4. https://unbox.ph/news/starbucks-multi-tier-rewards-program/ - Unbox, 2026-07-15. New app from 21 July 2026, Rewards at 50, 100 and 150 Stars, auto vouchers retired, 90-day window, Mobile Order & Pay missing at launch.
5. https://starbucks.ph/ (server HTML) - 28 KB shell, no JSON-LD, 11 of 12 images without alt.
6. https://pickup-coffee.com/ (page and server HTML) - Next.js, 500+ stores, app and Club promotion, news section, no JSON-LD, 19 of 72 images without alt.
7. https://pickup-coffee.com/pickup-club - Pickup Club tiers and thresholds over 90 days, 10,000 points for up to PHP 500 off, birthday treats; no earn rate.
8. https://pickup-coffee.com/menu - 13 categories, no prices or sizes, photos for 3 Signatures, "Also available hot".
9. https://apps.apple.com/us/app/id6444354574 - Pickup Coffee App Store listing. Pickup or delivery, ready notice, same-day scheduling (v2.0.0), Club Points (v3.0.0, 2025-10-06), cards and saved methods (v3.5.5, 11 June, year not shown), top-up up to PHP 500 off.
10. https://www.gadgetpilipinas.net/2023/08/pickup-coffee-app-launch/ - Gadget Pilipinas, 2023-08-02. Pre-order or scheduled pickup, Maya and GCash, bonus points on top-up.
11. https://www.boscoffee.com/ (page and server HTML) - Shopify, FoodPanda and GrabFood delivery, cart special instructions, 10% newsletter offer, skip link, no JSON-LD.
12. https://www.boscoffee.com/pages/store-locator-2 - Google map, 5 km radius, breakfast and 24-hour lists, addresses only.
13. https://www.boscoffee.com/blogs/news - Post dates 2025-11-25, 2024-01-05, 2023-08-14.
14. https://commune.ph/ (page and server HTML) - Hours, address, Waze and commute links, Viber or text orders, classes sold as products, event space, WordPress, JSON-LD WebSite and BreadcrumbList only, 10 of 31 images without alt.
15. https://commune.ph/menu/ - Text menu with prices, sizes, plant milk Price Deltas, tags, no photos.
16. https://commune.ph/commune-events/ - No dated Events; private booking only; no calendar.
17. https://yardstickcoffee.com/ (page and server HTML) - Shopify, beans and gear, 2024 journal posts, PayPal icon, JSON-LD Product, skip link.
18. https://yardstickcoffee.com/pages/cafe - 10 cafes with hours and PDF menus, Legazpi online pick-ups 9am to 4pm, one cafe with holiday hours, Flavor Bar reservations.
19. https://yardstickcoffee.com/pages/ycc - Yardstick Coffee Club: PHP 199 a month, 800 welcome points, 10% off, birthday perk, monthly events.
20. https://edsabdg.com/ (page and server HTML) - Shopify, barista classes, The Grid ordering link, hours, JSON-LD Organization, skip link.
21. https://support.bluebottlecoffee.com - Blue Bottle help center. Articles on cancelling online orders (a "very small window"), magic link email, item availability by cafe, cafe hours. Undated (footer 2025).
22. https://support.bluebottlecoffee.com/hc/en-us/categories/40065118477339-Membership - 17 membership articles including birthday reward and phone number use.
23. https://support.bluebottlecoffee.com/hc/en-us/articles/49514654528283-Mobile-App-Gift-a-drink-rules-and-guidelines - Gifts only between separate accounts; recipient needs the app; 48-hour support window.
24. https://apps.apple.com/us/app/id1440573734 - Blue Bottle App Store listing. Order ahead, customize, points for a drink for you or a friend; v4.10.2 dated 14 October, year not shown.
25. https://www.worldcoffeeportal.com/news/blue-bottle-coffee-elevates-loyalty-programme-with-focus-on-thoughtful-rewards/ - World Coffee Portal, 2025-09-13. Refreshed loyalty, order-ahead, reward tracking, gifting; rest paywalled.
26. https://api.squareup.com/help/us/en/article/6866-in-store-and-curbside-pickup-with-square-online-store - Square pickup settings: automatic times, prep time per order, capacity, pause, curbside text. Undated.
27. https://squareup.com/help/us/en/article/6889-set-up-customer-email-and-text-alerts-for-square-online-orders - Square order emails and status texts. Undated.
28. https://support.toasttab.com/article/Managing-Online-Order-Volume-Throttling-Orders-1492627940253 - Toast throttling and snooze. Updated 2026-09-16.
29. https://support.toasttab.com/article/Managing-Your-Takeout-and-Delivery-Schedule - Toast cut-off, scheduling range, lead time. Updated 2026-09-17.
30. https://docs.paymongo.com/docs/payment-acceptance-testing.md - PayMongo test mode, keys and test cards. Updated 2026-05-07.
31. https://docs.paymongo.com/docs/payment-channels-hosted-checkout.md - Hosted Checkout v1 and v2, request fields, `pass_on_fees`, email receipts, `checkout_session.payment.paid`. Updated 2026-10-13.
32. https://docs.paymongo.com/docs/payment-channels-key-concepts.md - Checkout Session lifecycle and expiry. Updated 2026-10-13.
33. https://docs.paymongo.com/docs/payment-acceptance-e-wallets.md - E-wallet types and authorization windows. Updated 2026-09-29.
34. https://docs.paymongo.com/docs/payment-acceptance-qr-ph.md - QR Ph variants and participating banks and e-wallets. Updated 2026-07-17.
35. https://docs.paymongo.com/docs/payment-acceptance-key-concepts.md - Payment Intent lifecycle and statuses. Updated 2026-10-13.
36. https://docs.paymongo.com/docs/developer-tools-webhook-setup-management.md - `Paymongo-Signature` format and verification steps. Updated 2026-05-07.
37. https://docs.paymongo.com/docs/developer-tools-webhooks-key-concepts.md and https://docs.paymongo.com/docs/developer-tools-retry-logic.md - Delivery rules, 30-second reply, 12 retries, per-mode endpoints. Updated 2026-09-10 and 2026-05-07.
38. https://docs.paymongo.com/docs/developer-tools-webhooks-events.md - Event types and payloads. Updated 2026-10-29.
39. https://docs.paymongo.com/docs/developer-tools-go-live-checklist.md and https://docs.paymongo.com/docs/developer-tools-best-practices.md - Idempotency keys, raw-body signature checks, acknowledge then process. Updated 2026-05-15 and 2026-10-13.
40. https://www.paymongo.com/pricing - Transaction fees. Undated, read 2026-10-30.
41. https://developers.google.com/search/docs/appearance/structured-data/local-business - LocalBusiness properties and hours rules. Updated 2026-09-08.
42. https://developers.google.com/search/docs/appearance/structured-data/search-gallery - Supported features list. Updated 2026-10-16.
43. https://developers.google.com/search/docs/appearance/structured-data/event - Event properties, eligibility, countries. Updated 2026-09-08.
44. https://schema.org/CafeOrCoffeeShop - Type hierarchy; `hasMenu` supersedes `menu`.
45. https://support.google.com/business/answer/10842217 - Business Profile online ordering options. Undated.
46. https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html - Data Privacy Act text, Sec. 3, 12, 16, 18, 20.
47. https://lawphil.net/statutes/repacts/ra2023/ra_11967_2023.html - Internet Transactions Act text, Sec. 4, 23, 32; approved 2023-12-05.
48. https://www.sunstar.com.ph/davao/dti-begins-full-enforcement-of-e-commerce-law-liability-rules-2 - News on ITA full enforcement from 2025-06-20 and the IRR (JAO 24-03). Seen in search results only, not opened: UNVERIFIED.
49. https://quezoncity.gov.ph/program/calorie-labeling/ - QC calorie labeling ordinance and phases. Updated 2026-07-29.
50. https://baymard.com/blog/food-delivery-and-takeout-ux-benchmark-2026 - Baymard food delivery and takeout benchmark. 2026-08-13.
51. https://baymard.com/lists/cart-abandonment-rate - Abandonment rate and reasons. Updated 2025-09-22.
52. https://baymard.com/research-articles/current-state-of-checkout-ux - Guest checkout findings. 2024-11-13, updated 2025-11-25.
53. https://measuringu.com/?p=508 - MeasuringU restaurant website ordering study. 2018-12-19.
54. https://www.florawellnesscafe.com/ (rendered page) - Flora Café home. Footer 2026. Hero photos of the patio and street, menu with add-on prices and fall specials, weekly flower day, next Event, merch, Posts, newsletter; address and hours only in the footer (about 6,700 px down at 390 px); share image 254 by 174 px; minimal LocalBusiness JSON-LD; Instagram and TikTok.
55. https://www.florawellnesscafe.com/about - Flora founder note: market coffee cart, pop-up, patio cafe since November 2024.
56. https://www.florawellnesscafe.com/events - Flora Events: date, time, instructor, ticket link, archive.
57. https://www.cafebinocle.com/ (rendered page) - Café Binocle, Shopify micro-roaster in French: subscriptions, newsletter, collaboration email; no cafe visit content.
58. https://escape.cafe/ (rendered page) - Escape Coffee Company, Shopify roaster: beans, subscriptions, wholesale; one address; 1200 by 630 share image; Organization JSON-LD.
59. https://www.elephantgrounds.com/ - Elephant Grounds home. Footer 2025. Story and Manila franchise, coffee program, pastries made in-house, events and catering contacts, one store with hours and a PDF menu, careers, app badges.
60. https://kurasu.kyoto/ (rendered page) - Kurasu home: bean and gear shop, 4,969 shop reviews, press, careers, wholesale and help center links, newsletter; 99 of 122 images with empty alt.
61. https://kurasu.kyoto/pages/cafe - Kurasu "Our Global Stores": a paragraph on each space (size, building history, transit), Google Maps links, no hours.
62. https://arabica.com/en/locations/ - % Arabica locations by region, country and city over an embedded Google Map; Philippines 2.
63. https://arabica.com/en/location/arabica-manila-bgc-roastery/ - % Arabica Manila BGC Roastery: design story (architect, facade, brick interior, booths), six nearby favourite spots, Google Maps place link; no hours in the rendered text.
64. https://www.rusticmornings.com/ - Rustic Mornings, Marikina. Footer 2019. Family story, phones, address and hours (second screen at 390 px), Bestsellers and drinks with prices, private event form; LocalBusiness JSON-LD; logo as share image.
65. https://www.purpleoven.com.ph/ - Purple Oven. Footer 2025. Menu link, hours by region on the first screen, branches as Google Maps search links, landline and Viber; no share tags or JSON-LD.
66. https://www.marygracecafe.com/ - Mary Grace Cafe home: What's New, Ube Series, founder's story, separate ordering site, careers, Facebook, Instagram, LinkedIn; no address or hours on Home.
67. https://www.marygracecafe.com/locations - Store filters by type, services (Alfresco Dining, Function Room, Kids Corner) and seating capacity; dine-in, take-away and delivery; call a branch before dropping by on holidays.
68. https://www.marygracecafe.com/functions - Event spaces per branch with capacity, hours, an inquiry button and a 48-hour reply.
69. https://nonos.ph/ - Nono's home. Footer 2026. Comfort food and bakery, PDF menus, events, What's New, newsletter opt-in sentence; share card titled "Home"; no address or hours on Home.
70. https://nonos.ph/our-stores/ - Nono's stores: daily hours, phone, a parking note per branch (nearest car park and walking time), function room flag.
71. https://nonos.ph/pet-friendly-policy/ - Nono's pet policy: alfresco, indoors when there is room, leash or carrier, off furniture, mall rules, no feeding from plates.
72. https://nonos.ph/coffee-cart/ - Nono's coffee cart for weddings, birthdays and company events; inquiry form and phone.
73. Domain checks, 2026-10-30: https://www.coffeeproject.com.ph/ (Shopify "This store is currently unavailable"), https://singleorigin.com.ph/ (open for registration; named as Single Origin's site in a search result), and about 15 guessed domains for other Metro Manila cafes (parked, unregistered, refusing connections or timing out, including `thecurator.com.ph` and `tobysestate.com.ph`). Supports: few Philippine cafes keep a working site of their own.
74. https://primer.com.ph/food/location/philippines/pasig/kapitolyo/stay-up-espresso-bar/ and https://www.remyeats.com/philippines/couch-club-kapitolyo/469 - Directory listings for Kapitolyo cafes that point to Facebook and Instagram. Seen in search results only, not opened: UNVERIFIED.
75. https://support.google.com/business/answer/9049526 - Google Business Profile, business attributes. Undated (footer 2026). Wi-Fi, outdoor seats, accessibility (entrance, restroom, seating, parking, elevator, hearing), attributes from visitors, availability by country and category.
76. https://schema.org/Place - `amenityFeature`, `smokingAllowed`, `publicAccess`, `isAccessibleForFree`, `maximumAttendeeCapacity`, `photo`, `hasMap`, `specialOpeningHoursSpecification`, `event`; `sameAs` and `image` from Thing.
77. https://schema.org/LocationFeatureSpecification - Name and value pairs, `hoursAvailable`, `validFrom`, `validThrough`; no fixed list of names.
78. https://schema.org/FoodEstablishment - `acceptsReservations` (Boolean, URL or text), `hasMenu`, `servesCuisine`; LocalBusiness `paymentAccepted`, `currenciesAccepted`, `priceRange`.
79. https://ogp.me/ - The Open Graph protocol. Required `og:title`, `og:type`, `og:image`, `og:url`; image width, height and alt; alt should accompany an image; types include `website` and `article`, no place type.
80. https://developers.google.com/search/docs/appearance/structured-data/review-snippet - Self-serving reviews are ineligible for stars; LocalBusiness review markup is for sites reviewing other businesses. Updated 2026-09-08.
81. https://developers.google.com/search/docs/appearance/structured-data/faqpage - FAQ rich results deprecated from 2026-05-07 and no longer shown (2026-06-15 entry).
82. https://developers.facebook.com/docs/instagram-platform/oembed - Meta Instagram oEmbed: embed HTML for front-end display only, no private accounts, 1,000 requests an hour. Undated.
83. https://getbento.com/blog/2023-diner-journey - BentoBox (vendor survey), 2023-05-17, over 2,000 US diners: 86% research online, 75% prefer the better website.
84. https://prnewswire.com/news-releases/survey-nearly-70-of-us-diners-say-a-restaurants-website-has-discouraged-them-from-visiting-300909229.html - MGH, a marketing agency (vendor survey), press release via PR Newswire, 2019-08-29, 1,101 US adults: website use before dining, food photos, what puts people off. MGH's own landing page (`mghus.com/lp/restaurant-survey`) not opened.
85. https://www.touchbistro.com/wp-content/uploads/2021/01/How_Diners_Choose_Restaurants_Singles.pdf - TouchBistro (vendor survey), "How Diners Choose Restaurants", fielded June 2017 by an independent firm, 521 US adults who eat out weekly: online menu 59%, website 51%, type of food 63%.
86. https://pos.toasttab.com/blog/on-the-line/restaurant-reviews-and-ratings-data - Toast diner survey. Blocked by a bot check; "32% always check websites" seen in search results only: UNVERIFIED.
