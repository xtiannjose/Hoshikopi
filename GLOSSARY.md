# Hoshikopi

A concept cafe in Metro Manila with a website where customers browse the menu, order ahead for pickup, collect Stars and follow events and news. This glossary fixes the words the product, the code and the database use. Add a word here before using it in code.

## Language

### Menu

**Menu Item**:
Something a customer can order, as the menu names it (for example "Spanish Latte" or "Ube Pandesal"). One Menu Item has one Base Price.
_Avoid_: Product, SKU, dish, drink (as a type name)

**Category**:
A group on the menu (Coffee, Non-coffee, Tea, Pastries, All-day food, Beans and merch). A Menu Item belongs to exactly one Category.
_Avoid_: Section, collection, department

**Base Price**:
The price of a Menu Item with its default Options, in centavos, VAT included.
_Avoid_: Price (alone, when an Option changes it), cost

**Option Group**:
A choice the customer makes on a Menu Item: Size, Milk, Sugar Level, Ice Level, Extra Shots, Add-ons. Each group says whether it is required and how many Options may be picked.
_Avoid_: Modifier group, variant, customization (as a type name)

**Option**:
One choice inside an Option Group (for example "Oat milk", "Large", "50% sugar"). An Option may add a Price Delta.
_Avoid_: Modifier, add-on (unless it is in the Add-ons group), variant

**Price Delta**:
The amount an Option adds to the Base Price, in centavos. Zero for most Options; never negative.
_Avoid_: Upcharge, surcharge

**Sold Out**:
A Menu Item or Option that cannot be ordered today but stays visible on the menu. It resets at the next opening.
_Avoid_: Out of stock, unavailable (for Hidden items)

**Hidden**:
A Menu Item that does not appear on the menu at all (retired, or seasonal and off-season).
_Avoid_: Disabled, archived, deleted

### Ordering

**Cart**:
The Menu Items a customer has chosen but not yet ordered. One Cart per browser for guests, one per Member when signed in.
_Avoid_: Bag, basket, tray

**Line**:
One entry in a Cart or Order: a Menu Item, its chosen Options, a quantity and an optional note ("less ice please"). Two identical choices merge into one Line.
_Avoid_: Item (for the entry), row

**Order**:
A customer's confirmed request to prepare Lines for pickup. An Order snapshots every name, Option and price at checkout, so later menu edits never change it.
_Avoid_: Transaction, ticket (for the customer side), purchase

**Order Code**:
The short code the barista calls out and the customer shows at pickup (for example `K-042`). It restarts each day.
_Avoid_: Order number (for the long id), reference

**Pickup Time**:
When the customer collects the Order: either As Soon As Possible (shown as "ready in about N minutes") or a Scheduled Pickup in a 15-minute window within Opening Hours.
_Avoid_: Delivery time, slot (alone), ETA

**Pickup Window**:
One 15-minute period of a day that holds a limited number of drinks and food Lines (its Capacity). An Order takes room in exactly one Pickup Window.
_Avoid_: Slot, time slot, timeslot

**Capacity**:
How many drinks and how many food Lines the bar can finish in one Pickup Window. Set by the Manager per day of the week.
_Avoid_: Limit, throughput

**Prep Time**:
The estimated minutes from Accepted to Ready, from the current queue and the Lines in the Order.
_Avoid_: Wait time (for the estimate), ETA

**Order Status**:
Where an Order stands: Placed, Paid, Accepted, Preparing, Ready, Picked Up, or one of the closing states Cancelled, Expired (unpaid in time) and Refunded. Only defined transitions are allowed (`docs/03-ARCHITECTURE.md`).
_Avoid_: State (in UI copy), stage

**Ordering Paused**:
The Manager has stopped new Orders for now (busy bar, closing early). Menu stays visible; checkout says when ordering resumes.
_Avoid_: Busy mode, store closed (when the cafe is open)

### Payments

**Payment Method**:
How the customer pays: GCash, Maya, Card (online, through PayMongo) or Pay at Pickup (at the counter, no provider).
_Avoid_: Payment type, channel, tender

**Payment**:
One attempt to pay an Order online, with its provider id and status. An Order has at most one successful Payment.
_Avoid_: Charge, transaction (alone)

**Test Mode**:
Hoshikopi is a concept: online payments run against PayMongo's test mode or the local `fake` provider only, and never take real money (ADR 0003).
_Avoid_: Sandbox (in UI copy), demo payments

**Refund**:
Money returned for a paid Order that was cancelled by the cafe or could not be made, in full.
_Avoid_: Reversal, return

### People and accounts

**Customer**:
Anyone ordering: a Guest or a Member.
_Avoid_: User (for customers), buyer, client

**Guest**:
A Customer ordering without an account. Gives a name and a phone number or email for the Order; earns no Stars.
_Avoid_: Anonymous user

**Member**:
A Customer with an account. Earns and redeems Stars and sees past Orders.
_Avoid_: User, loyalty member, subscriber

**Staff**:
People who work the cafe and use the staff screens. Roles: Barista and Manager.
_Avoid_: Admin (for baristas), employee, crew (in code)

**Barista**:
Staff who use the Bar Screen: accept, prepare and complete Orders, and mark Menu Items Sold Out.
_Avoid_: Crew, operator

**Manager**:
Staff who also edit the menu, prices, Opening Hours, Capacity, Events and Posts, and issue Refunds.
_Avoid_: Admin, owner (in code)

**Bar Screen**:
The staff page on a tablet behind the counter that lists live Orders by Pickup Time and moves them through Order Status.
_Avoid_: Kitchen display, KDS, POS, dashboard

### Loyalty

**Star**:
The loyalty unit. A Member earns 1 Star for each drink Line unit in a Picked Up Order. Stars from a Refunded Order are taken back.
_Avoid_: Point, stamp, coin

**Star Card**:
A Member's Star balance shown as a card of 9 spaces. Nine Stars can be redeemed for one Reward.
_Avoid_: Loyalty card, punch card, wallet

**Reward**:
What Stars buy: a free drink (any Size, Options at Base Price), or a Birthday Treat once a year. Applied at checkout as a Line priced at zero.
_Avoid_: Voucher, coupon, perk

**Redemption**:
Spending Stars on a Reward in an Order. If the Order is Cancelled or Expired, the Stars come back.
_Avoid_: Claim, use

### Cafe and content

**Opening Hours**:
The cafe's regular hours per day of the week, in Manila time.
_Avoid_: Schedule, store hours (in code)

**Special Hours**:
A one-day change to Opening Hours (holiday, private event, closed for maintenance).
_Avoid_: Holiday hours (for non-holidays), exceptions

**Event**:
Something happening at the cafe on a date: a cupping, latte art night, open mic, market day. Has a start, an end and an optional sign-up link.
_Avoid_: Activity, happening

**Post**:
A news article on the site: a new drink, a story about a supplier, a cafe update.
_Avoid_: Blog, article (in code), news item

**Concept Notice**:
The visible note that Hoshikopi is a concept: the cafe, its address and its people are invented, and payments are in Test Mode (ADR 0006).
_Avoid_: Disclaimer (in code), demo banner
