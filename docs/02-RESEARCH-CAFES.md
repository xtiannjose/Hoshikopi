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
