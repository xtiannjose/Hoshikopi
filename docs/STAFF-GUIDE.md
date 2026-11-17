# Running the cafe on Hoshikopi

> **In plain words:** This guide shows Baristas and the Manager how to run the cafe on the website: signing in, the Bar Screen behind the counter, and every page under Manage. Each step uses the exact words the site shows. Two things to know first: a Barista needs nothing but the Bar Screen, and Hoshikopi is a concept, so no real money moves.
>
> **Who should read it:** Baristas and the Manager, before their first shift; the owner, when training someone new.
> **Last checked:** 2026-11-17.

## Contents

1. [Before you start: this is a concept site](#1-before-you-start-this-is-a-concept-site)
2. [Signing in](#2-signing-in)
3. [The Second Factor (your 6-digit code)](#3-the-second-factor-your-6-digit-code)
4. [Who can do what](#4-who-can-do-what)
5. [The Bar Screen](#5-the-bar-screen)
6. [Manage: the home page](#6-manage-the-home-page)
7. [Orders and Refunds](#7-orders-and-refunds)
8. [Menu](#8-menu)
9. [Hours and Capacity](#9-hours-and-capacity)
10. [Events and Recurring Events](#10-events-and-recurring-events)
11. [Posts](#11-posts)
12. [Inquiries](#12-inquiries)
13. [Adjust Stars](#13-adjust-stars)
14. [Staff](#14-staff)
15. [Reports](#15-reports)
16. [Cafe details](#16-cafe-details)
17. [A normal day](#17-a-normal-day)
18. [Common questions](#18-common-questions)
19. [Known gaps that affect Staff](#19-known-gaps-that-affect-staff)

The words in capitals (Menu Item, Order Code, Pickup Time, Star...) have one meaning each, listed in the [Glossary](../GLOSSARY.md).

## 1. Before you start: this is a concept site

Hoshikopi is a portfolio project. The cafe, its address and its people are invented ([ADR 0006](adr/0006-concept-project-no-real-money.md)). Every page, including the Bar Screen and Manage, shows the **Concept Notice** at the foot: "Hoshikopi is a concept cafe. Orders and payments here are for demonstration. About this concept".

- **Payments are in Test Mode.** GCash, Maya and Card go through a test checkout, never a real one ([ADR 0003](adr/0003-payments-paymongo-test-mode.md)). On the hosted demo that checkout is a stand-in page called the Test Mode checkout. A Refund on the site gives back no real money either. Pay at Pickup (paying at the counter) involves no payment company at all.
- **Emails are limited on the hosted demo** (https://hoshikopi.vercel.app). The site has no email service there, so it sends nothing to real addresses:
  - Staff and Customers sign in with **Continue with Google**. Email sign-in links work only for the three seeded demo accounts (addresses ending in `@hoshikopi.example`), and their links go to the hosting logs, which only the owner can read.
  - Order emails (placed, ready, refunded) and the email about a new Inquiry are not delivered.
  - Event Sign-ups are confirmed on the spot, since no confirmation link could be sent.
  - With an email service set up (Resend, `docs/06-SETUP.md` section 9), all of these go to real inboxes. On a developer's computer they go to the terminal and the `data/mail/` folder.
- **Demo Mode.** On the hosted demo, a visitor can tap the bar's steps on their own Order page ("Be the barista"), because nobody is behind the bar ([ADR 0015](adr/0015-demo-mode-visitor-plays-the-barista.md)). So an Order on the demo's Bar Screen can move without a Barista. The site records those taps as `demo`, never as a Staff member.
- **The hosted demo takes Orders all day**, from midnight to 11:15 PM Manila time, so visitors in any time zone can try it. From 11:15 PM to midnight it takes no Orders, and checkout says so (audit DC-29). The Manage pages and the Visit page still show the real Opening Hours, so the Ordering tile on Manage may say "Not taking orders" while the demo's checkout still takes them.

## 2. Signing in

Staff sign in like any Customer: there is no password. Your role (Barista or Manager) is what opens the staff pages.

1. On the site, tap **Sign in** in the header (or go to `/sign-in`).
2. Tap **Continue with Google**, or type your email and tap **Email me a link**. (Continue with Google shows only where Google sign-in is set up.)
   - With the email link you see "Check your email". The link works once, for 5 minutes. Not there in a minute? Check Spam or Promotions.
3. Open the link, or finish signing in with Google. You are signed in.
4. Open your account (`/account`). Staff see a box called **For Staff (Barista)** or **For Staff (Manager)** with two links: **Manage the cafe** and **Bar Screen**.

A sign-in lasts about 7 days and renews while you use it. If you open a staff page while signed out, the site sends you to sign in and then back to that page.

To sign out, tap **Sign out** on your account page or on the Manage home page. On a shared tablet, sign out at the end of the day.

| You see | What it means | What to do |
| --- | --- | --- |
| "That link has expired or was already used. Ask for a new one below." | The link was older than 5 minutes, or already opened. | Ask for a new link. |
| "Too many links asked for. Try again in 15 minutes." | The site limits how many links one email, or one connection, can ask for in 15 minutes. | Wait 15 minutes, or use Google. |
| "Email links are switched off on this demo. Continue with Google instead." | You are on the hosted demo (section 1). | Use Continue with Google. |
| "Too many Google sign-ins from here. Try again in 15 minutes." | Many Google sign-ins came from this connection. | Wait 15 minutes. |

**New Staff:** the person signs in once first, so the site knows their email. Then a Manager gives them a role on the Staff page (section 14).

## 3. The Second Factor (your 6-digit code)

The **Second Factor** is a 6-digit code from an authenticator app on your phone (an app such as Google Authenticator, Microsoft Authenticator or 1Password that shows a new code every 30 seconds). It proves it is really you, even if someone gets into your email ([ADR 0014](adr/0014-staff-second-factor-in-identity.md)).

### When the site asks for it

| What you are doing | Asks for the code? |
| --- | --- |
| Bar Screen: seeing Orders, moving them along, Sold Out | Never |
| Bar Screen: Pause ordering, Busy Mode, Cancel (Managers) | Yes |
| Any page under Manage (`/manage`), for a Barista or a Manager | Yes |

Once you enter it, it lasts **12 hours** for that sign-in on that device. After 12 hours, the next Manage page asks again. Signing in on another phone or computer asks again there too.

A Barista who only works the Bar Screen never needs the app. The code page itself says so: "No phone with you? The Bar Screen doesn't need a code." with a link **Open the Bar Screen**.

### Setting it up (first time)

1. Sign in, then open **Manage the cafe** from your account.
2. You see "One more step, (your name)." and the heading **Set up your authenticator**.
3. On your phone, open the authenticator app and add an account.
4. Scan the QR code on the screen, or type the **Setup key** shown under it (letters in groups of four). Working on the phone itself? Tap **Open it in the app on this phone**.
5. The app now shows a Hoshikopi code. Type it in **6-digit code** and tap **Continue**.
6. When it worked, you land on the page you wanted.

### Every time after that

The page says **Enter your code**. Open the app, type the newest 6-digit code for Hoshikopi and tap **Continue**.

| You see | What to do |
| --- | --- |
| "That code didn't match. Type the newest code from your app." | Type the code showing now. If it keeps failing, set your phone's clock to set itself automatically. The site allows for a clock about 30 seconds off. |
| "Too many tries. Wait 15 minutes, then try again." | Ten tries in 15 minutes is the limit. Wait, then try again. |
| You lost your phone or deleted the app | Ask whoever runs the site (the developer). They remove your old setup ([docs/06-SETUP.md](06-SETUP.md) section 6), and the next Manage visit shows the setup page again. The Bar Screen works meanwhile. |

## 4. Who can do what

| Task | Barista | Manager |
| --- | --- | --- |
| Bar Screen: see and move Orders | Yes | Yes |
| Sold Out and Back on (Bar Screen) | Yes | Yes |
| Manage home and the Menu page (Sold Out only, with the code) | Yes | Yes |
| Cancel an Order | No: ask a Manager | Yes, with the code |
| Pause ordering, Busy Mode | No | Yes, with the code |
| Orders and Refunds | No | Yes |
| Edit the menu: Menu Items, prices, photos, Categories, Option Groups | No | Yes |
| Hours, Capacity, Prep Time | No | Yes |
| Events, Posts, Inquiries | No | Yes |
| Adjust a Member's Stars | No | Yes, never their own |
| Give or take Staff roles, sign someone out everywhere | No | Yes, never their own |
| Reports, Cafe details | No | Yes |

The Staff page sums it up: "Barista: the Bar Screen and Sold Out on the menu." and "Manager: everything in Manage, including Refunds and Staff." A Barista who opens a Manager-only page sees "This page could not be found". Every Staff action is logged with the person's name.

### Every staff page

| Page | Address | Who |
| --- | --- | --- |
| Your code (Second Factor) | `/manage/two-factor` | Staff |
| Bar Screen | `/bar` | Barista, Manager |
| Manage home | `/manage` | Barista, Manager |
| Menu | `/manage/menu` | Barista (Sold Out), Manager |
| A Menu Item | `/manage/menu/item/new`, `/manage/menu/item/<id>` | Manager |
| Categories | `/manage/menu/categories` | Manager |
| An Option Group | `/manage/menu/options/new`, `/manage/menu/options/<id>` | Manager |
| Orders and Refunds | `/manage/orders` (another day: `?day=2026-11-17`) | Manager |
| Hours and Capacity | `/manage/hours` | Manager |
| Events | `/manage/events`, `/manage/events/new`, `/manage/events/<id>` | Manager |
| Recurring Events | `/manage/events/weekly` | Manager |
| Posts | `/manage/posts`, `/manage/posts/new`, `/manage/posts/<id>` | Manager |
| Inquiries | `/manage/inquiries` | Manager |
| Adjust Stars | `/manage/stars` | Manager |
| Staff | `/manage/staff` | Manager |
| Reports | `/manage/reports` (30 days: `?days=30`) | Manager |
| Cafe details | `/manage/cafe` | Manager |

## 5. The Bar Screen

The **Bar Screen** (`/bar`) is the page on a tablet behind the counter. It lists today's live Orders and moves each one through its steps with one tap. It always uses the dark Night palette, at any hour, and its buttons are large for fingers.

Open it from your account (**For Staff**, then **Bar Screen**), or go to `/bar`. While it loads you see "Opening the Bar Screen...".

### 5.1 Turn on the sound

Browsers keep a page silent until someone taps it.

1. Tap **Tap to turn on sound** at the top. Any tap on the board works too.
2. The button disappears. New Orders now play a short two-note chime.

**Sound for new orders** switches the chime off and on. The tablet remembers your choice. A new Order also glows in the New column for 4 seconds, so you see it even with the sound off.

### 5.2 How it stays up to date

- The board checks for changes every 3 seconds while it is on screen.
- It asks the tablet to keep the screen awake (a "wake lock"), on browsers that allow it. A sleeping tablet stops checking and chiming.
- The clock at the top shows Manila time and updates every 30 seconds.

### 5.3 The columns

The board shows only today's Orders (the Manila day, from midnight). An online Order (GCash, Maya, Card) appears once it is paid. A Pay at Pickup Order appears as soon as it is placed.

| Column | What is in it |
| --- | --- |
| **New** | Orders to start now: every As Soon As Possible Order, and Scheduled Orders whose time to start has come. Empty: "No new orders yet. They chime in here." |
| **Later today (N)** | A folded list under New: Scheduled Orders whose Pickup Time is still far off. Tap it to open. |
| **Making** | Orders you accepted or are making. Empty: "Nothing on the bar." |
| **Ready** | Orders waiting at the counter. Empty: "Nothing waiting at the counter." |

With no Orders at all, the board says "All caught up. Salamat, team!"

**When a Scheduled Order moves into New:** at its Pickup Time minus the Prep Time (the site's estimate of how long the bar needs, section 9). For example, an Order for 3:00 PM with a Prep Time of 10 minutes moves from Later today into New at 2:50 PM. You can still tap Accept on an Order in Later today.

### 5.4 Reading a card

- **The Order Code** in large type, for example `K-042`. Call it out at pickup; the Customer shows the same code. Codes start again each day.
- **The time.** "ASAP, due 3:15 PM" for an As Soon As Possible Order, or "3:15 PM" for a Scheduled one. Under it, the Customer's first name.
- **"Pay at Pickup: collect PHP 250"** when the Customer pays at the counter.
- **The Lines:** "2 x Hoshi Latte", with the chosen Options under each (Large · Oat milk). A note from the Customer ("less ice please") is highlighted.
- **Reward:** a tag on a drink the Customer gets free for 9 Stars. Its Options still cost their price.

### 5.5 Moving an Order along

Each card has one big button. It always shows the next step.

| Card is in | Button | After the tap |
| --- | --- | --- |
| New (or Later today) | **Accept** | Moves to Making. |
| Making, just accepted | **Start making** | Stays in Making. |
| Making, being made | **Ready** | Moves to Ready. The Customer's Order page shows Ready and chimes; they also get a "ready" email where emails work. |
| Ready, paid online | **Picked up** | Leaves the board. A Member earns 1 Star for each drink. |
| Ready, Pay at Pickup | **Paid and picked up** | Leaves the board, and the Order is recorded as paid at the counter. Collect the money first. |

- While it saves, the button says **Moving...**.
- If someone else moved the Order first, you see "K-042 changed before your tap. The board is up to date." Nothing is lost.
- There is no step back. Tap with care.

### 5.6 Late cards

A card gets a thick yellow border and a **Late** tag when its Pickup Time has passed and it is not Ready yet. Make these first.

### 5.7 Cancelling an Order (Managers)

Only a Manager who has entered the code sees **Cancel K-042** under each card. A Barista asks a Manager. A Customer can cancel on their own Order page until the bar taps Accept.

1. Tap **Cancel K-042**.
2. In **Reason (the Customer sees it)**, type a reason or pick one: "An ingredient ran out", "The bar is closing early", "You asked us to cancel".
3. Tap **Cancel this order**.
4. You see "Cancelled K-042. Your reason shows on their Order page."

What happens: a paid online Order is refunded in full at once. A Pay at Pickup Order is simply cancelled. Either way the Order's room in its Pickup Window comes back, and Stars spent on a Reward go back to the Member. If the refund does not go through, the Order shows under **Needs a refund** on the Orders page (section 7).

### 5.8 Sold Out

At the bottom of the board is a folded list, **Sold out today**, with the number of things sold out now.

1. Tap **Sold out today** to open it. It says "Ran out of something? Tap Sold out. It stays sold out for today only and comes back on by itself."
2. Find the Menu Item (listed by Category) or the Option (listed by Option Group, such as Oat milk under Milk).
3. Tap **Sold out**. The button turns into **Back on**. Tap that when it is back.

Sold Out needs no code. Customers still see the item on the menu but cannot order it. Everything Sold Out comes back on by itself at midnight Manila time. The list keeps itself up to date: a change made on another device, or the midnight reset, shows within a few seconds.

### 5.9 Pause ordering and Busy Mode (Managers)

These buttons show at the top for a Manager who has entered the code. Without the code, the top shows a link **Enter your code to pause or cancel**, which brings you back to the Bar Screen after the code.

| Button | What it does | Ends |
| --- | --- | --- |
| **Pause ordering 30 min** | Stops new Orders for 30 minutes. The menu stays up; checkout shows "The bar is swamped. Back in 30 minutes, salamat!". The board shows "Ordering Paused until 3:30 PM." | By itself after 30 minutes, or tap **Resume ordering**. |
| **Busy +10 min, 30 min** | Adds 10 minutes to Prep Time for 30 minutes. Ordering stays open; Customers see later times, and checkout says the bar is extra busy. | By itself, or tap **End Busy Mode**. |
| **Busy +15 min, 1 hour** | Adds 15 minutes to Prep Time for 1 hour. | By itself, or tap **End Busy Mode**. |

While Busy Mode runs, the board says, for example, "Busy Mode: Prep Time +10 min until 3:30 PM. Customers see the longer times." The Busy buttons hide while ordering is paused.

Which to use: **Busy Mode** for a rush the site cannot see, such as a line of walk-ins at the counter. **Pause** when the bar cannot take more Orders at all, or is closing early. Other pause lengths and your own message are on the Hours page (section 9).

### 5.10 "You're signed out"

If the board shows "You're signed out, so the board stopped updating." in red, tap **Sign in again**. This happens when a Manager signed you out everywhere or changed your role. If the internet drops for a moment, the board simply tries again on the next check.

### 5.11 Close it after service

Close the Bar Screen tab when the bar closes. Do not just leave it on the tablet.

Why: the site's database runs on Neon's free plan, which has a monthly allowance of computer time. The database sleeps only after some idle minutes, and an open Bar Screen checks every 3 seconds, so it keeps the database awake all night. When the allowance runs out, Neon stops the database until the next month and every page that reads it fails ([docs/06-SETUP.md](06-SETUP.md) section 9). The wake lock keeps the screen on, so a forgotten tab keeps going.

## 6. Manage: the home page

**Manage** (`/manage`) is the start page for every other staff page. It asks for the code (section 3).

At the top: a greeting, "Signed in as (your name) (Manager)." and a **Sign out** button. Then the **Today** strip:

| Tile | What it shows | Tap it for |
| --- | --- | --- |
| **Ordering** | "Taking orders" with "Last order 8:30 PM" (or the Busy Mode time while it runs); "Paused" until a time; "Closed today"; or "Not taking orders" ("Before opening time" or "After last order"). | Hours and Capacity (Managers) |
| **Live orders** | How many Orders are on the bar now. | The Bar Screen |
| **New inquiries** (Managers) | Inquiries waiting for a reply. | Inquiries |
| **Today so far** (Managers) | Today's Orders and the amount **booked** (all of today's Orders not cancelled, expired or refunded, including Pay at Pickup not yet collected). Booked is not Sales. | Orders and Refunds |

Below are the pages, grouped by job. A Barista sees only the Bar Screen and Menu.

- **Run the day:** Bar Screen, Orders and Refunds, Hours and Capacity.
- **Menu and stories:** Menu, Events, Posts, Inquiries.
- **People and numbers:** Reports, Adjust Stars, Staff, Cafe details.

Most forms under Manage work the same way. The button says **Saving...** while it saves, then the form says **Saved.** If something is wrong, it says **Some fields need a fix.** and a note under each field says what to change. Changes show on the public site right away. Each page has a back link at the top (for example **Manage** or **Menu**).

## 7. Orders and Refunds

**Orders and Refunds** (`/manage/orders`, Managers) lists one day's Orders, with totals, Refunds and cancels.

### 7.1 Choosing a day

It opens on today. To see another day, pick it in **Day** and tap **Show**, or use **Previous day**, **Next day** and **Back to today**.

### 7.2 The totals

| Tile | Meaning |
| --- | --- |
| **Orders** | Orders that day, not counting cancelled, expired or refunded ones. |
| **Booked** | Their total. It includes Pay at Pickup still to collect and online Orders not yet paid. Sales (Picked Up Orders only) are on Reports. |
| **Pay at Pickup still to collect** | Money the counter still has to take, and from how many Orders. |
| **Cancelled or refunded** | How many Orders that day were cancelled or refunded. |

### 7.3 The list

One row per Order: **Code** (opens the Customer's Order page), **Placed** (time), **Name**, **Items** (on wide screens), **Pickup** (time), **Payment** (GCash, Maya, Card or Pay at Pickup), **Status** and **Total**. The Status is the Order Status: Placed, Paid, Accepted, Preparing, Ready, Picked Up, or one of the closing states Cancelled, Expired (an online Order not paid within 15 minutes) and Refunded.

### 7.4 "Needs a refund"

When the site holds money for an Order that is over, a red box called **Needs a refund** shows at the top, whatever day you are looking at. It says "Paid after it closed, or its refund didn't go through. Open its day and refund it there." Two cases:

- The Customer paid after the Order had expired or been cancelled.
- A refund was tried but the payment company refused it.

Tap the Order Code in the box to open its day, then refund it as below. Check this page every day; the hosting keeps error logs for only an hour.

### 7.5 Giving a Refund

A Refund always returns the full amount. There are no part refunds. The **Refund K-042** link shows on an Order that was Picked Up (and cost more than PHP 0), on a cancelled Order that was paid but not refunded, and on an Order paid after it closed.

1. Find the Order (choose its day).
2. Tap **Refund K-042** in its row.
3. Read the line that opens:
   - Paid online: "Refund PHP 250 in full?"
   - Pay at Pickup: "Give PHP 250 back in cash, then confirm." Hand the cash back first.
4. Tap **Yes, refund K-042**.
5. You see "Refunded K-042. The Customer sees it on their Order page." (or "Refunded K-042 in cash."). The Order Status becomes Refunded. The Customer gets a "refunded" email where emails work, and a Member loses the Stars that Order earned.

If you see "The refund for K-042 didn't go through. Try again in a minute.", wait and try again. Until it works, the Order stays under Needs a refund. For an Order paid after it expired, only the money goes back; its status stays Expired or Cancelled.

### 7.6 Cancelling from here

**Cancel K-042** shows on any Order not yet Picked Up, Cancelled, Expired or Refunded, on any day. Type a reason (the Customer sees it) and tap the button, which says **Cancel K-042**, or **Cancel K-042 and refund** when it is paid. A paid Order is refunded in full.

| Message | Meaning |
| --- | --- |
| "Cancelled K-042. Your reason shows on their Order page." | Done. |
| "K-042 wasn't cancelled. Write a reason the Customer will see." | The reason was empty. |
| "K-042 can't be cancelled now. It was already picked up, cancelled or refunded." | Someone moved it first. |
| "K-042 can't be refunded now. It may have changed." | Someone refunded or changed it first. |

## 8. Menu

**Menu** (`/manage/menu`) lists every Category with its Menu Items, then every Option Group with its Options. The top says "Ran out of something? Tap Sold out. It stays sold out for today only and comes back on by itself."

- **Everyone** (with the code): each row shows the name, the price and a **Sold out** or **Back on** button, the same as on the Bar Screen (section 5.8). Pills say **Sold out today** and **Hidden**.
- **Managers** also see **Add a Menu Item**, **Categories** and **Add an Option Group** at the top, and each name opens its editor.

The **Jump to** row of buttons scrolls to a Category or to Option Groups.

### 8.1 Prices

Type prices in pesos, like `165` or `165.00` (up to PHP 100,000). The site keeps them exactly, to the centavo. A new price applies to new Orders only: every Order keeps the names, Options and prices it was placed with.

### 8.2 Adding or editing a Menu Item

Tap **Add a Menu Item**, or tap an item's name. The editor has five parts. Finish with **Add Menu Item** (new) or **Save Menu Item**.

| Part | Field | What to put |
| --- | --- | --- |
| The basics | **Category** | The Category it belongs to (one only). |
| | **Name** | As the menu shows it, for example "Spanish Latte". |
| | **Web address** | The end of its page address: lowercase words joined by dashes, like `hoshi-latte`. Filled in from the name for a new item. |
| | **One line about it** | A short description, up to 200 characters. |
| Price and promo | **Base Price (PHP)** | The price with its default Options. |
| | **Promo (optional)**: **Promo price (PHP)**, **First day**, **Last day** | A lower price on these Manila days (a **Promo**). Fill all three or none. It must be lower than the Base Price, and Option prices still add on top. The menu shows the regular price struck through. |
| On the menu | **A drink (earns a Star, counts toward drink Capacity)** | Tick for drinks; leave empty for food and merch. |
| | **Hidden from the menu** | Takes it off the menu completely (see 8.3). |
| | **On the menu until (optional)** | For a **Seasonal** item: after this day it is Hidden by itself. |
| | **Order on the menu** | Lower numbers come first in its Category. |
| | **Badges** | Day Barista Pick, Night Barista Pick, New, Best seller, Vegan, No caffeine. |
| | **Allergens it contains** | Milk, Egg, Wheat, Soy, Peanuts, Tree nuts, Fish, Shellfish, Sesame. Its page shows them as "Contains: milk". |
| | **Calories (kcal, optional)** | A whole number up to 3000, for its default choices. Shown as a concept estimate. |
| Choices | **Option Groups it offers** | Tick each group the Customer chooses from (Size, Milk...). |
| | **Goes well with** | A **Pairing**: another Menu Item shown on its page with a one-tap Add. "Nothing" for none. |
| Photo | **Photo** | JPEG, PNG or WebP, 4:3, under 2 MB. Choose a new file to replace the current one. |
| | **Photo description (alt text)** | Describe the item as a menu would, for people who cannot see the photo. |

After adding, you see "Added. It's on the menu now." (or "Added. It's hidden for now; untick Hidden when it's ready.") and a link **Add another**. On an existing item, **See it on the site** opens its public page, and pills show **Sold out today**, **Hidden**, **Promo until** a date and **On the menu until** a date.

**Barista Picks.** Each palette has three: the Day picks (Day Barista Pick) and the Night picks (Night Barista Pick). Home and the menu show the current palette's set. A fourth is refused with "Three Day Barista Picks already: A, B and C. Untick one of them first." Untick one on another item, then try again.

### 8.3 Sold Out, Hidden and taking things off the menu

| Want | Use | Comes back |
| --- | --- | --- |
| Out of it for today | **Sold out** button | By itself at midnight, or **Back on** |
| Off the menu for now or for good | **Hidden from the menu** on the item | When you untick it |
| On the menu until a date | **On the menu until** | Untick Hidden after that day |

Menu Items cannot be deleted; hide them instead. Past Orders keep their own copy either way.

### 8.4 Categories

**Categories** (`/manage/menu/categories`) shows one small form per Category: **Name**, **Web address** (set when the Category is added and fixed after that, so links to it keep working), **Order** (lower numbers come first) and **Hidden** ("Takes the whole Category and its items off the menu."). Tap **Save** (with the Category's name) to keep a change. **See it on the site** opens its public page.

To add one, fill **Add a Category** and tap **Add Category**. You see "Added. It's in the list now." and a link **Add an item to it**.

### 8.5 Option Groups and Options

An **Option Group** is a choice the Customer makes on a Menu Item, such as Size or Milk. An **Option** is one answer in it, such as "Oat milk". An Option may add a **Price Delta** (an amount added to the Base Price, never taken off).

To add a group:

1. Tap **Add an Option Group**.
2. Fill **Name**, **Least picks (0 makes it optional)** and **Most picks (1 means one choice)**. For example, Size is 1 and 1; Add-ons might be 0 and 3.
3. Tap **Add Option Group**. You see "Added. Now add its Options below, then tick it on each Menu Item that offers it."
4. Under **Add an Option**, fill **Option**, **Price Delta (PHP)** ("0 for no change. It is added to the Base Price.") and **Order**, then tap **Add Option**. Repeat for each Option.
5. Open each Menu Item that offers the group and tick it under **Option Groups it offers**.

Each Option also has:

- **Picked by default**: the choice the item starts with. In a one-choice group, ticking a new default unticks the old one.
- **Hidden: not on the menu (past Orders keep it)**.
- **Allergens it adds**: for example, Almond milk adds Tree nuts.

The group page shows **Offered by** (which Menu Items offer it) and **Customers see** (the Options as the menu shows them). **Delete this Option Group** shows only while no Menu Item offers it; tap it, then **Yes, delete it**. Its Options go too, and past Orders keep their copy.

## 9. Hours and Capacity

**Hours and Capacity** (`/manage/hours`, Managers) sets when the cafe takes Orders and how many. A pill at the top says **Taking orders**, **Paused until** a time, or **Not taking orders**. All times are Manila time.

### 9.1 Ordering Paused

**Ordering Paused** stops new Orders for a while. The menu stays up; checkout says when ordering is back.

1. Choose **Pause for**: 15 minutes, 30 minutes, 1 hour or 2 hours.
2. Edit **Message for Customers** (shown at checkout, up to 160 characters). It starts as "The bar is swamped. Back soon, salamat!".
3. Tap **Pause ordering**. You see "New Orders are paused until 3:30 PM." with your message.

It ends by itself, or tap **Resume ordering**. Busy Mode starts only from the Bar Screen; while it runs, this panel shows it and an **End Busy Mode** button.

### 9.2 Special Hours

**Special Hours** change one day: a holiday, a private event, a coffee festival.

1. Pick the **Date** (today or later).
2. Fill **Why (shown to Customers)**.
3. Tick **Closed all day**, or set **Opens**, **Last order** and **Closes** (in 15-minute steps).
4. Tap **Add Special Hours**.

The list shows the days coming up; **Remove** deletes one. Adding Special Hours for a day that has some replaces them. If a change leaves Orders booked after today's new closing (shortening or closing today in Special Hours or Opening Hours, or removing today's later Special Hours), the page says how many: cancel them with a reason on the Orders page (section 7.6).

### 9.3 Opening Hours

**Opening Hours** is the regular week, shown to Customers on the Visit page. Each day has **Closed**, **Opens**, **Last order** and **Closes**. **Last order** is the latest time an Order can be placed, for example 8:30 PM when the cafe closes at 9:00 PM. Tap **Save Opening Hours**.

A day's rule: "Last order must be after opening and by closing." A day ticked Closed can leave its times empty.

### 9.4 Capacity and Prep Time

A **Pickup Window** is one 15-minute part of the day. **Capacity** is how much the bar can finish in one window, set per day of the week:

- **Drinks per window**: counts every cup (2 Hoshi Lattes count as 2).
- **Food Lines per window**: counts each food Line, whatever its quantity.

Whole numbers from 0 to 200. When a window is full, checkout offers the next one.

**Prep Time** is the site's estimate of the minutes from Accept to Ready. It is **Base minutes** plus **Minutes per drink ahead** for each drink already in the queue (accepted or being made, plus As Soon As Possible Orders waiting), plus any Busy Mode minutes, rounded up to the next 5 minutes. Use numbers from 0 to 60, like 4 or 1.5. The panel shows an example: "with 4 drinks ahead, about N minutes".

Tap **Save Capacity** to keep both.

## 10. Events and Recurring Events

**Events** (`/manage/events`, Managers) holds dated Events (a cupping, a latte art night), under **Coming up** and **Past** ("Show N past Events" when there are many). Each tile shows the date, the time, "N of M seats taken" and a pill: **Draft**, **Published** or **Past**.

### 10.1 Adding or editing an Event

Tap **Add an Event**, or tap an Event's tile.

| Field | What to put |
| --- | --- |
| **Title** | Up to 80 characters. |
| **Web address** | Lowercase words joined by dashes, like `latte-art-night`. If you change it later, Sign-up links already emailed still work. |
| **Starts (Manila time)**, **Ends** | Date and time. The end comes after the start. A new Event starts as a week from today, 7 to 9 PM. |
| **One line about it** | A short summary. |
| **Price (PHP, empty for free)** | Paid at the door; the site takes no money for Events. |
| **Sign-up link (optional)** | An `https://` link if people sign up somewhere else. |
| **Seats for Sign-ups here (optional)** | 1 to 500. People sign up on the Event page until these run out. Empty for no Sign-up here. |
| **About the Event** | The full text, in Markdown (simple marks for formatting: `**bold**`, `*italic*`, `- lists`, `[links](https://...)`). A **Preview** shows it as the site will. |
| **Published on the site** | Untick to keep it as a draft. |

Tap **Add Event** or **Save Event**. A new draft says "Saved as a draft. Tick Published on the site when it's ready." A published Event has **See it on the site**. Events cannot be deleted; untick **Published on the site** to take one down.

### 10.2 Sign-ups

A **Sign-up** is one person's place at an Event: a name, an email and 1 to 4 Seats. The **Sign-ups** panel beside the form shows "N of M seats taken, K left." and each person with their Seats. "Waiting for the email link" means they have not confirmed yet; an unconfirmed Sign-up holds its Seats for 30 minutes.

- **Remove (name)**, then **Yes, remove them**: their Seats go back. They are not told, so email them first if they should know.
- **Email the confirmed guests (N)** opens your email app with every confirmed guest in BCC.

When you save fewer Seats than are taken, or take an Event off the site while it has Sign-ups, the form warns you. The guests are not told, so email them.

### 10.3 Recurring Events

**Recurring Events** (`/manage/events/weekly`) are weekly, with no date and no Sign-up ("Open mic, Thursdays, 7 to 9 PM"). They show on the Events and cafe pages.

Fill **Add a Recurring Event**: **Title**, **Day**, **Starts (Manila time)**, **Ends**, **Note (optional)** and **Shown on the site**, then tap **Add Recurring Event**. You see "Added. It's in the list." Each one in the list has its own form and Save button. To pause one, untick **Shown on the site**; there is no delete.

## 11. Posts

**Posts** (`/manage/posts`, Managers) are news from the cafe: a new drink, a story about a supplier. Drafts stay here until you publish them.

1. Tap **Write a Post**.
2. Fill **Title**, **Web address** and **One line for the news list (up to 180 characters)**. A counter shows how many characters you used.
3. Write **The Post** in Markdown (see 10.1). **Preview** shows it as the site will.
4. Tick **Published on the site** to publish it now, or leave it for a draft.
5. Tap **Add Post**, then **Save Post** for later changes.

A published Post shows the date it was published and **See it on the site**. Untick **Published on the site** to take it off the News page. A draft can be deleted: **Delete this draft**, then **Yes, delete it** (this cannot be undone).

## 12. Inquiries

An **Inquiry** is a Customer's request about a private event or a large Order, sent from **Send us an inquiry** on the Visit page. **Inquiries** (`/manage/inquiries`, Managers) lists them under **Waiting for a reply**, **Answered** and **Closed** ("Show N closed").

Each card shows the kind (**Private event** or **Large order**), the name, when it came, the email, the date wanted, the number of guests or drinks, and the message.

1. Tap **Reply by email**. Your email app opens with the subject "Your Hoshikopi inquiry".
2. Send your reply from your email app.
3. Back on the card, tap **Mark answered**. Later, tap **Close** when it is settled. **Reopen** brings a closed one back.

The site also emails each new Inquiry to the cafe's email (Cafe details), where emails work.

## 13. Adjust Stars

A Member earns 1 **Star** per drink at pickup; 9 Stars buy a free drink (a Reward). **Adjust Stars** (`/manage/stars`, Managers) adds or takes Stars by hand, for example after a long wait.

1. Type the **Member's email** (the one they sign in with).
2. In **Stars to add (use a minus to remove)**, type a number: `2` adds two, `-2` takes two away.
3. Write a **Reason**, up to 120 characters. The Member sees it in their Star history as "Changed by the cafe", so write it for them: "Sorry about the wait, a Star on us."
4. Tap **Save adjustment**. You see "Saved for (email). (Name) now has N Stars."

Then **Adjust another Member**, or **See Reports**.

| Rule | Message if broken |
| --- | --- |
| Up to 50 Stars at a time, either way | "Use up to 50 Stars at a time, either way." |
| A reason and a number other than 0 | "Give a reason and a number of Stars other than 0." |
| The balance cannot go below zero | "That would take the balance below zero. They have N Stars now." |
| Never your own Stars | "You can't adjust your own Stars. Ask another Manager." |
| The email must belong to a Member | "No Member has that email." |

Every change is logged with your name.

## 14. Staff

**Staff** (`/manage/staff`, Managers) gives and takes roles. A person must have signed in once (with email or Google) before they can get a role.

### 14.1 Adding Staff

1. Under **Add Staff**, type the **Email they signed in with**.
2. Choose the **Role**: Barista or Manager.
3. Tap **Give role**. You see "(Name) is now a Barista." (or a Manager).

If you see "No account has that email yet. Ask them to sign in once, with email or Google, then try again.", they have not signed in yet. Add Staff never lowers anyone's role; for that it says to use **Save** on their row.

### 14.2 The team

**The team** lists every Staff member, Managers first, with their email and role.

- **Change a role:** choose Barista, Manager or **Member (no staff access)** on their row and tap **Save**. Lowering a role warns you first ("They lose staff access and are signed out now." or "They lose Manager access and are signed out now.") and signs them out at once. Choose Member to remove someone from the staff.
- **Sign out everywhere:** tap it, then **Yes, sign (name) out**. They are signed out on every phone and computer and can sign in again with their email. Use it for a lost tablet or phone.

**One Manager always stays.** Nobody can change their own role (your row says "(you)" and "Another Manager can change your role."), so the last Manager can never remove themselves. Every change is logged.

## 15. Reports

**Reports** (`/manage/reports`, Managers) counts Picked Up Orders by the day they were placed, in Manila time. Choose **Last 7 days** or **Last 30 days**.

- **Sales** (the total of Picked Up Orders), **Orders picked up** and **Average order**.
- **Sales by day**: every day in the range, newest first, with the busiest day named.
- **Top Menu Items**: what sold most, with how many and for how much.
- **Stars**: Earned on Orders, Birthday Treats, Redeemed for free drinks, Taken back on Refunds, Given by a Manager, Taken back by a Manager.
- **Orders that did not go through**: Cancelled, Expired unpaid, Refunded.

On the concept site these are demo Orders.

## 16. Cafe details

**Cafe details** (`/manage/cafe`, Managers) is what the Visit page tells people. Tap **Save cafe details** at the end; you see "Saved. The Visit page shows it now." and a link **See the Visit page**.

| Section | Fields |
| --- | --- |
| **Where and how to reach us** | **Neighbourhood**; **Map pin latitude** and **Map pin longitude** (put the pin on a public spot nearby, never a home; **Check the pin on a map** opens it in a new tab); **Email** (where Inquiries go); **How to get here** (Markdown, no street address). |
| **Amenities** | Wi-Fi, Power outlets, Pets allowed, Smoking allowed, Restroom, Step-free entrance, Accessible restroom: each **Yes**, **No** or **Leave it off** (hides an Amenity you are not sure about). Then **Laptop note**, **Pets note**, **Parking and the nearest car park**. |
| **The space and the story** | **The space** (seats, light, how it feels by day and by night); **Our story** (Markdown; label every invented person). |

## 17. A normal day

### Opening

1. Sign in on the bar tablet and open the **Bar Screen**.
2. Tap **Tap to turn on sound**. Check **Sound for new orders** is on.
3. Mark anything you are out of as **Sold out**.
4. Manager: on Manage, check the **Ordering** tile says "Taking orders" at opening time, and look at **New inquiries**. On Orders and Refunds, check the **Needs a refund** box is not there.

### During service

1. A chime means a new Order in **New**. Tap **Accept**, then **Start making**, then **Ready**.
2. At the counter, call the Order Code. Collect the amount on Pay at Pickup cards, then tap **Picked up** or **Paid and picked up**.
3. Make **Late** cards first. Peek at **Later today** now and then; those Orders move into New when it is time to start them.
4. Ran out of something? **Sold out** in the list at the bottom.
5. Rush at the counter? A Manager taps **Busy +10 min, 30 min** (or +15). Bar overwhelmed? **Pause ordering 30 min**.

### Closing

1. Clear the board. Every Order should end Picked Up or Cancelled. For a no-show, a Manager cancels it with a reason; a paid one is refunded in full.
2. Manager: on Orders and Refunds, check **Pay at Pickup still to collect** matches the cash, and that **Needs a refund** is empty.
3. Close the **Bar Screen** tab (section 5.11). On a shared device, tap **Sign out** on your account page.

The site also tidies up by itself. Online Orders unpaid after 15 minutes expire. Each morning before opening, Orders from earlier days that the bar never accepted are cancelled: Pay at Pickup ones with the reason "The day ended before it was picked up", and paid online ones with the reason "The day ended before we made it", which also refunds the payment in full.

## 18. Common questions

| Question | Answer |
| --- | --- |
| A Customer's drink is sold out. | Tap **Sold out** on the Bar Screen so nobody else orders it. An Order cannot be changed after it is placed. If the Customer cannot take something else at the counter, a Manager cancels the Order with the reason "An ingredient ran out"; a paid Order is refunded in full. |
| A payment needs a refund. | Manager: **Orders and Refunds**, find the day, tap **Refund K-042**, then **Yes, refund K-042** (section 7.5). Pay at Pickup: give the cash back first. Anything in the red **Needs a refund** box needs it too. |
| An online Order is not on the Bar Screen. | It is not paid yet. It shows once paid; unpaid, it expires after 15 minutes. Its Status on the Orders page says Placed or Expired. |
| An Order is stuck. | On the Bar Screen, tap its button again; if someone moved it first, the board updates. If the board shows "You're signed out", sign in again. An Order from an earlier day is not on the Bar Screen: a Manager finds it with **Previous day** on Orders and Refunds and cancels or refunds it there. |
| A Customer wants to cancel. | Before the bar taps Accept, they can cancel on their own Order page. After that, a Manager cancels it (section 5.7 or 7.6). |
| Someone can't sign in. | The link works once, for 5 minutes: ask for a new one and check Spam. On the hosted demo, use **Continue with Google**. If a staff page says it could not be found, they have no Staff role (or are a Barista on a Manager page): a Manager gives the role on **Staff**, after they have signed in once. |
| I'm asked for my code again. | The code lasts 12 hours per sign-in, so a new day or a new device asks again. The Bar Screen's own work never asks. Lost your phone? See section 3. |
| A Member says their Stars are wrong. | Manager: **Adjust Stars** with a reason they will read (section 13). |
| A tablet or phone with a staff sign-in was lost. | Manager: **Staff**, their row, **Sign out everywhere**. |

## 19. Known gaps that affect Staff

The 2026-11-17 check of the whole app ([docs/audit/2026-11-17.md](audit/2026-11-17.md)) found these. Each has a planned fix; until then, work around them.

| Gap | Workaround |
| --- | --- |
| A free Reward Order's card says "collect PHP 0.00" (DC-30). | Nothing to collect; tap **Paid and picked up**. |
| Hiding every Category stops the next update of the site from building (DC-27). | Keep at least one Category showing. |
