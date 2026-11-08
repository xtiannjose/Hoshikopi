# Design System

Status: v0.4, 2026-11-07 (page polish, batch 8.10). The look and feel of Hoshikopi. Built with native elements and CSS only ([ADR 0011](adr/0011-native-elements-and-css.md)); library parts (the old Sample B) were not built.

## 1. Design read

**"Star coffee": a neighbourhood cafe that stays open into the evening.** Warm cream and espresso by day and deep night-sky ink by night, switching with the cafe's clock (section 3), and one small gold star used with restraint: the logo mark, the Star Card, the "ready" moment. It should feel like a real Kapitolyo cafe with a point of view, not a template and not a theme park. Photos carry the warmth; the interface stays calm and quick to scan on a phone.

**Owner's brief (2026-10-30): very modern and aesthetic.** It should look like a design-led cafe people screenshot and share, not a small-business template: confident type, generous space, large photography, polished details. "Star coffee" stays; it is expressed in a modern way.

Reference mood: paper stamp cards, a window seat at dusk, a well-designed cafe you would photograph.

### 1.1 Reference sites (shortlist; the owner picked Flora Café)

Checked live on 2026-10-30. We borrow layout ideas and feel only, never names, copy, photos or code.

| Vibe | Sites | What to borrow |
| --- | --- | --- |
| Quiet minimal | arabica.coffee, bluebottlecoffee.com, seycoffee.com, kurasu.kyoto, glitchcoffee.com | Full-width photos, small spaced capitals, lots of empty space |
| Warm editorial | ceremonycoffee.com, florawellnesscafe.com (Awwwards Honorable Mention 2026) | Serif headlines over warm photos, cream paper feel, "Order ahead" up front |
| Bold and playful | cafebinocle.com (Awwwards HM 2026), gourouindianfood.fr (Awwwards HM 2026), partnerscoffee.com, tandemcoffee.com, elephantgrounds.com | Huge type, bright colour blocks, illustration, sticker-like badges |
| Dark and dramatic | onyxcoffeelab.com, escape.cafe (Awwwards Site of the Day 2024), newmixcoffee.com (Awwwards HM 2026) | Night backgrounds, one strong accent colour, cinematic photos; fits the night-sky ink |

**Owner's pick (2026-10-30): Flora Café, florawellnesscafe.com.** It reads as a cafe, not a bean shop, and the menu is right there on the home page. What to borrow (looked at on the live site at 1280 and 390 px):

- **Paper and one accent.** A grainy cream paper background, with one deep red (about `#B63530`) for the announcement bar, small label buttons and line drawings. Nothing else is coloured. (Hoshikopi keeps its own accent; see the decisions below.)
- **Type with three voices.** Italic serif for headings and menu categories ("Explore Our Menu", "Coffee"), small uppercase sans for item names, and a typewriter mono for prices, notes and buttons.
- **A printed-menu section on Home.** Categories side by side, names left, prices right, add-ons with their price ("Coconut whip +$0.75"), short notes under an item, one photo beside the list. This maps directly to Categories, Menu Items, Options and Price Deltas.
- **Film-style photos.** Big, candid, slightly grainy shots of the counter, people and cups, edge to edge.
- **Hand-drawn line art.** Small one-colour drawings (a cup, a vase) and wobbly hand-drawn divider lines between sections.
- **Events and Posts in the same voice.** "Upcoming event", a dated line, an italic title, one label button.

Owner's decisions on Flora (2026-10-30):
- **Accent: Hoshikopi's gold star and night ink, not Flora's red.** Where Flora puts red on cream (label buttons, line drawings, dividers), we use night ink or kopi brown; gold stays for star moments (principle 2, and gold is never text on cream).
- **Fonts: a typewriter mono as a third family** (section 4): Courier Prime, kept in batch 1.1 (ADR 0011).
- **Menu: both.** Home gets a printed-menu section; `/menu` keeps photo cards (section 6).

We redraw everything ourselves: no Flora photos, drawings, copy or logo.

### 1.2 Wireframes (claude.ai canvases, 2026-10-30)

Each has the same twelve boards, with labelled photo slots: Home at 1280 and 390 px; at 390 px the Hoshi Latte page, the Visit page (`/cafe`), Cart and checkout, Order status, the Star Card and account page (`/account`), Events, a Post and About this concept (`/concept`); the Bar Screen on a 1194 px tablet; and the Manager pages at 1280 px (Today with Refunds and Ordering Paused, the Menu editor with Sold Out, Hours and capacity). Preview settings: Home's pickup card (sample time, live clock, closing soon, closed, Ordering Paused); Order status for each Order Status; the account page for a Member with 5 Stars, a Reward ready, a new Member or signed out; the Manager pages for each section. Not wireframed: Cafe details, Events, Posts and Staff forms in `/manage`, and V1 features.

| Direction | Link | What it is |
| --- | --- | --- |
| Day | https://claude.ai/artifact/2NM1a1FXU6wKkuxcTGMrag | The chosen layout (next row) in the Day palette, 6 AM to 6 PM: cream paper with grain, espresso text, kopi buttons, latte cards, kopi line art. The earlier Flora-style Day layout is in this canvas's version history. |
| Night | https://claude.ai/artifact/Q8W4V38NB5JdyH3m8sFJC7 | The chosen layout in the Night palette, 6 PM to 6 AM. Both canvases hold the same boards and a Theme setting (Day, Night, or Auto by Manila time). The layout: Hoshikopi's own, with Day's type (section 4: italic serif headings, Plus Jakarta Sans, Courier Prime), pickup times in the hero, Barista picks this week right after it, Day's hand-drawn dividers in slate, a menu the Customer switches (with a List and Photos switch drawn as two stars on a dashed thread) between a full list (default) and photo cards by Category, the Star Card as a nine-star constellation that draws a cup, and Day's upcoming Event with a Latest post column, both with photos. |

**Owner's decision (2026-10-30):** Night's layout and content, with Day's colours and paper grain by day and Night's colours by night ([ADR 0010](adr/0010-theme-follows-manila-time.md)). Section 3 holds both palettes; it is built with native elements and CSS ([ADR 0011](adr/0011-native-elements-and-css.md)).

## 2. Principles

1. **The menu is the product.** Big photos, clear prices, Options one tap away. Nothing decorative stands between a Customer and "Add to order".
2. **One accent.** Gold appears in at most one place per screen. Stars are earned, not sprinkled.
3. **Phone first, thumb first.** Primary actions sit in the bottom third; the Cart is reachable from every page.
4. **Native where it works.** Native radio buttons, checkboxes, selects and date inputs, styled, before custom widgets ([ADR 0011](adr/0011-native-elements-and-css.md)).
5. **Calm motion.** Short, meaningful transitions; nothing loops on screen while ordering; all motion respects reduced motion.
6. **Words do the work.** Plain, warm, Filipino-English where natural ("Salamat! We're making your Hoshi Latte."). No em dashes in UI copy.

## 3. Colour tokens

Values match `src/app/globals.css` (checked 2026-11-07); they must pass the contrast checks in section 10. Two palettes share every token: **Day** (cream paper, kopi brown, paper grain) and **Night** (night ink, moonlight). The Day column comes from the Day wireframe, the Night column from the main wireframe.

| Token | Day | Night | Use |
| --- | --- | --- | --- |
| `--background` | cream `#FBF6EE` | ink `#141B2E` | Page background; Day adds the paper grain |
| `--foreground` | espresso `#2B1D14` | moonlight `#EEF0F7` | Body text |
| `--muted` | latte `#EFE5D6` | `#1C2540` | Cards, inputs, Sold Out wash, the Star Card panel |
| `--muted-foreground` | roast `#6E5A4B` | `#B9BFD3` | Secondary text (AA on `--background` and `--muted`) |
| `--primary` | kopi `#5A3420` | moonlight `#EEF0F7` | Primary buttons, selected Options, the lit pickup line |
| `--primary-foreground` | cream `#FBF6EE` | ink `#141B2E` | Text on primary |
| `--border` | `#E2D6C4` | `#334068` | Hairlines |
| `--input` | `#8C7662` | `#6874A0` | Control borders, rings, dashed lines, hand-drawn dividers (3:1 on `--background` and on `--muted`) |
| `--star` | gold `#E8B74A` | gold `#E8B74A` | Logo star, Star Card stars; never for text on cream |
| `--star-edge` | kopi `#5A3420` | none | Thin outline that keeps gold stars visible on cream |
| `--lit` | kopi `#5A3420` | gold `#E8B74A` | Lit lines of the Star Card constellation |
| `--night` | ink | ink | Ink that stays the same in both palettes: text on the Line note badge on the Bar Screen |
| `--ring` | `#2F6FD6` | `#2F6FD6` | Focus ring (visible on cream and on ink) |
| `--success` | `#256B42` | `#6FCF97` | Paid, Picked Up, "Open now" (4.5:1 on `--muted` too) |
| `--warning` | `#8A4F00` | `#F0A35E` | Preparing, Ordering Paused, the Last Order countdown (4.5:1 on `--muted` too) |
| `--destructive` | `#B3261E` | `#FF8A80` | Cancel, errors |

**Which palette shows** ([ADR 0010](adr/0010-theme-follows-manila-time.md)): Day from 6:00 AM to 5:59 PM Manila time, Night from 6:00 PM to 5:59 AM, for every visitor wherever they are; the site follows the cafe's sky. A switch in the header (Auto, Day, Night, shown as a stopwatch, a sun and a star with the words as screen-reader labels and tooltips) pins one, saved per browser; Auto is the default. The device's light or dark setting is not used. The Bar Screen always uses the night palette.

Native radios and checkboxes take `accent-color` from `--primary`, so they are kopi by Day and moonlight by Night.

## 4. Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display and headings | Fraunces 400 italic, the one style used, loaded static (about 23 kB; the variable font with every weight and optical size was 81 kB) | Warm serif with character for the menu and hero; open font licence |
| Text and UI | Plus Jakarta Sans (variable) | Clear at small sizes; made by an Indonesian foundry, a nod to kopi; open font licence |
| Order Codes and prices in tables | Plus Jakarta Sans with tabular figures | `font-variant-numeric: tabular-nums` |
| Typewriter accents | Courier Prime, regular only | Prices in the printed-menu section, short notes under items, dates, small label buttons (the Flora feel, section 1.1); never body text; open font licence |

Self-hosted through `next/font`, `display: swap`: two variable families plus the mono at one weight. Scale (rem): 0.875, 1, 1.125, 1.25, 1.5, 2, 2.75, 3.5. Body 1 rem (16 px) at minimum; line length 60 to 75 characters for reading text (Posts, Events, page intros, the concept, privacy and Visit pages). The token for it is `max-w-measure` (`--container-measure: 34em` in `globals.css`): in em, so it follows the text's own size, about 68 to 72 characters at 16 to 18 px. Tailwind's `max-w-prose` (65ch) is not used: the zero in Plus Jakarta Sans is wide, so 65ch runs about 100 characters.

## 5. Shape, space, elevation

- Radius: 12 px for cards and inputs, full pills for chips and the Cart button.
- Spacing on a 4 px grid; page gutter 16 px on phones, 24 px on tablets, 32 px on desktop.
- Elevation through tone (cream to latte) and one soft shadow for floating elements (Cart button, drawers). No glassmorphism.

**Layout** (batch 8.10). The owner asked for the whole screen on wide monitors, with phones and laptops still comfortable.

- **Page container:** the `page-width` utility in `globals.css`, 96rem (1536 px) wide with 16, 24 and 32 px gutters. The site header, the footer, the Staff header and every `main` use it, except the fake payment page (`max-w-md`, a provider sheet) and the Bar Screen (full bleed).
- **Wide pages fill it:** Home, the menu, a Menu Item, Visit, Events, News, the account pages and every Manage page.
- **Focus pages keep one narrower column** that starts at the logo like every other page (no `mx-auto`, so the left edge never jumps between pages): `max-w-6xl` for the Cart, checkout, the Order page, an inquiry, an Event and the concept page, and `max-w-5xl` for sign-in and privacy.
- **A Post is the one centred page:** its header and text at `max-w-measure` (both at 18 px, so they line up), its cover at `max-w-5xl`.
- **Reading text** stays at `max-w-measure` (section 4). Form fields are never wider than `max-w-3xl`. Lists with a name and a price on one row (Popular this week, Every week) stop at `max-w-3xl`, so the price stays near its name.

Grids add columns as the screen grows:

| What | Columns |
| --- | --- |
| Menu Item cards | 1 below sm (a row with a 6rem square photo), 2 from sm, 3 from lg, 4 from xl, 5 from 2xl |
| Event cards | 2 from md, 3 from xl |
| Post cards | 2 from md, 3 from lg, 4 from 2xl; on `/news` the newest is a lead card spanning 2 |
| Tiles (Manage areas, Amenities) | 2 from sm, 3 from lg |
| Main column and aside | From lg, a main column plus a 24rem aside, sticky at `top-6` (Cart, checkout, the Order page, an Event, an inquiry) |
| Equal pairs | 2 from lg |
| Stat strips | `auto-fit` columns of at least 14rem |
| Bar Screen lane | A second card per row only when each keeps 17rem (`auto-fill`), about 1900 px wide and up |

Number columns in tables are right aligned with tabular figures.

## 6. Components

| Component | Notes |
| --- | --- |
| Home order | Hero (headline, Order ahead as the primary action and Plan your visit, which jumps to the visit block; the hero pickup card; a room photo), divider, Barista picks this week, the Home menu section, Star Card, next Event and latest Post, divider, visit block with a photo of the space (PRD INFO-08) |
| Hero pickup card | A ticket-style card: top line with the Manila clock, "Open until 9:00 PM", the neighbourhood and a directions link, so "where and when" shows on the first phone screen; the Pickup Time in the italic serif; a row of Pickup Windows (Now, the next four, Other) as rings on a dashed line, the picked one a star and the line lit up to it; Other opens a native time input. Within 60 minutes of Last Order the status reads "Last order in 25 min" in `--warning`. When closed or Ordering Paused, the row gives way to the reopening time |
| Hero copy | One headline and line per palette, both in the page, the current palette shows one (PRD INFO-12). Day: "Your morning kopi, ready before you get here." / "Magandang umaga! Order ahead on your way in, pick up at the counter and earn a Star with every drink." Night: "Your evening kopi, ready before you get here." / "Order ahead for a study night or a late merienda, pick up at the counter and earn a Star with every drink." |
| Divider | A hand-drawn wobbly line in `--input`, full width, between the hero and Barista picks and before the visit block |
| Barista picks | "Barista picks this week": three Menu Items with the `barista_pick` badge, one large and two small, each with photo, name, price, one line and Add to order |
| Visit block | The neighbourhood, today's hours, a directions link and the email; no phone, no street number (PRD section 2) |
| Amenity list | On `/cafe`: Phosphor icon, label, short note ("Wi-Fi: yes, ask at the bar"); an unknown Amenity is left out |
| Visit FAQ | On `/cafe`: about eight native `details` elements. Visit answers come from the Amenities and Dine-in rules; ordering and Stars answers come from the PRD rules (cancel until Accepted, Refunds, Pay at Pickup limit, Stars, large Orders); no FAQ structured data |
| Home menu section | The Flora-style printed menu (section 1.1): Categories side by side, Menu Item names left, prices right in the mono, one photo beside the list; each name links to its Menu Item page; Sold Out items show "Sold out today"; "Make it yours" lists the Price Deltas below. A View switch (List, Photos) sits above it: two rings on a dashed thread with italic serif labels, the picked one a star; Photos shows Menu Item cards behind Category tabs |
| Menu Item card | Used on `/menu`. Photo (4:3), name, one-line description, price, badges; below sm it is a row with a 6rem square photo beside the text. Sold Out greys the photo and replaces the price with "Sold out today" |
| Option picker | Each Option Group is a `fieldset` with a `legend`; single choice uses styled native radios as large chips; multi choice uses checkboxes; the Price Delta sits on the chip ("Oat +35"); the running price updates in a live region. Below 768 px the running price, the quantity and Add to order are a sticky bar at the bottom of the screen (CSS only; the floating Cart pill steps aside there); Save as Favourite stays in the page |
| Category tabs | On `/menu` and each Category page: pill links that scroll sideways on a phone and stay at the top of the screen while the menu scrolls, on the page background, edge to edge over the gutter |
| Allergen line | Under the description on the Menu Item page: an info icon and "Contains: milk. Almond milk adds tree nuts." in the mono, then the kitchen note "Made in a kitchen that handles milk, egg, wheat, soy and tree nuts, so traces are possible."; "No common allergens" when empty (PRD MENU-07) |
| Pairing (V1) | Under the Option Groups: "Goes well with", one small card (photo, name, price, an add button) (PRD MENU-08) |
| Quantity stepper | Two 44 px buttons around the number; long-press free |
| Cart button and drawer | In the header, and once the Cart holds something a floating pill at the bottom right ("Your Cart", the count and total; not on the Cart or checkout). It opens a drawer from the right, a native `popover` like the phone menu: the Lines, the total, Check out and See your Cart (Fix your Cart to check out when a Line can't be ordered). A spacer at the end of the page keeps the pill off the footer |
| Error and 404 pages | Inside the frame they happen in, so the header and the Concept Notice stay: "Sorry, that didn't work" with Try again and a way on (the menu, or Manage for Staff) and the error code for a bug report; "This page could not be found" with See the menu and Back home (Back to Manage for Staff). An unknown address gets the customer header and footer; a failed root layout gets its own page with the notice |
| Pickup Time picker | "As soon as possible: ready in about 10 min" first, then the next 6 windows as even-width chips (three to a row on a phone), then "Later today" with the rest in a native `select` grouped by hour (`optgroup`); choosing a time there picks that row. Full windows are not shown (ordering for tomorrow comes in V1) |
| Payment Method list | Radio cards: GCash, Maya, Card, Pay at Pickup, each with its logo or icon and a one-line note; a "Test Mode" tag on online methods |
| Order status timeline | Placed, Paid, Accepted, Preparing, Ready, Picked Up; the current step is announced politely; Ready uses the gold star |
| Star Card | "Nine Stars make a cup": a constellation of nine points that draws a cup. Earned Stars are gold stars (with `--star-edge` by day) joined by `--lit` lines; the rest are small rings on dashed `--input` lines. A Reward appears when all nine are lit, with Pick your free drink. The card lays out by its own width (a container query), so it fits a sidebar or a full row |
| Account button | A 44 px round icon button beside the Cart, like the menu button: an outlined person for Sign in, a filled person on `--muted` for Account (accessible names "Sign in" and "Account"). From sm up; on phones Account sits in the menu so the Cart keeps its room |
| Account page | Greeting with "Signed in as" and a "Member since" pill (a gold star); Sign out at the top. From lg up two columns: the Star Card and a list of links (Star history, Download my data, Privacy) on the left, kept in view; Your orders, Your Favourites and Your details as outlined panels on the right, each with an icon in a `--muted` circle. Orders show a status pill (Ready in `--success`); Favourites are `--muted` tiles with Add and a corner Remove; empty panels offer the next step. Staff also see a "For Staff" box (an espresso border) at the top of the left column, with Manage the cafe and Bar Screen, since the staff screens are not in the public header. Batch 8.10 added a greeting by the cafe's clock (Magandang umaga, hapon or gabi), a banner for a live Order, jump links on phones, earlier Orders folded away, and a third column from 2xl |
| Manage home | Greeting with "Signed in as" and Sign out; a Today strip of `--muted` tiles that link where each can be acted on (Ordering: Taking orders in `--success`, Paused or Closed; Live orders; New inquiries for Managers, in `--warning` when some wait); then the areas the role may open as outlined tiles with an icon in a `--muted` circle and one line each, grouped as Run the day, Menu and stories, People and numbers. Batch 8.10 added the greeting as a mono eyebrow, a Today so far tile for Managers, tiles that lift on hover, and the three groups side by side from 2xl |
| Event card, Post card | Photo, title, one line. An Event card puts its date block on the photo's corner and shows "Free" or a price. A Post card has a lead variant: the newest Post on `/news` spans two columns |
| Concept Notice | A slim footer line and a short note on checkout: "Hoshikopi is a concept cafe. Orders and payments here are for demonstration." It links to `/concept`. The Staff and Bar frames carry it too, with the same link |
| Bar Screen card | See section 9 |
| Back link | `BackLink`: an arrow and the parent's name ("Menu", "Your account"), never an Order Code or a Menu Item name; a 44 px target. On every page below the top level; the header and footer lead to the top-level pages |
| Breadcrumb | `Breadcrumb`: Menu / Category / Menu Item, the only three-level public path. In the mono; the current page is marked with `aria-current` and has no link |
| Page header | `PageHeader`: the back link, a mono eyebrow, the italic h1 with its actions (pills, links) beside it, and an intro at `max-w-measure`. Pills never go inside the h1, since tests read its text |
| Panel | `Panel`: an outlined section with an icon in a `--muted` circle beside its heading; the section is a region named by that heading |
| Empty state | `Empty`: a `--muted` box, the icon in a `--background` circle, a warm line and a next step (a link or a button), never a bare "Nothing here" |
| Pill, Order Status pill | `Pill`: a small outlined label in a tone (plain, muted, `--success`, `--warning`, `--destructive`); `--warning` marks what needs a look (a new inquiry, Ordering Paused, Sold out today). `OrderStatusPill`: Ready in `--success`, waiting Orders (Placed to Preparing) plain, closed ones (Picked Up, Cancelled, Expired, Refunded) muted |
| Icon circle | `IconCircle`: a Phosphor icon (20 px, or 24 px in the large size) in a round `--muted` wash, or `--background` on a `--muted` surface |
| Main nav | The current section is underlined in `--input` and carries `aria-current="page"`; no gold, which stays for Stars |
| Phone menu | The header popover: each item's icon in a circle, the logo goes home, the theme switch, then the area and the small links (Privacy, About this concept) at the bottom |
| Footer | The hand-drawn divider, the sign-off "Salamat sa pagdaan. See you at the counter.", three labelled link lists side by side from md, 44 px links on phones, Back to top, and the Concept Notice |
| Staff frame | The `/manage` header: Staff links to `/manage`, the theme switch, tab titles "%s \| Staff \| Hoshikopi", and the Concept Notice linking `/concept`, as in the Bar frame |

Native elements and CSS only ([ADR 0011](adr/0011-native-elements-and-css.md)). A library component needs a new ADR that shows a native element cannot do the job.

## 7. Motion

Updated 2026-11-07 (batch 8.9, Motion pass): the owner found the site too still, so every state change now moves a little. Still calm, still CSS first.

- **CSS and the platform only:** transitions, keyframes, `@starting-style`, scroll-driven animations (`animation-timeline: view()`) behind `@supports`, and React's `<ViewTransition>` for page changes. No animation library ([ADR 0011](adr/0011-native-elements-and-css.md)); the only new JavaScript is the Cart count remembering its first value.
- **Only transform and opacity move** (`translate`, `scale`, `rotate`, `opacity`), so nothing shifts the layout and CLS stays at 0. Colours change at once.
- **Timing:** 150 ms for press feedback; 200 to 250 ms for UI (page fade, drawer, disclosures, crossfades); 350 to 500 ms for the delight moments; about 750 ms for a full Star Card. Easing: `--ease-calm` (`cubic-bezier(0.22, 1, 0.36, 1)`) for everything, `--ease-pop` (a small overshoot) for the delight moments only. Tokens, keyframes and the `.lift`, `.reveal` and `.drawer` classes live in `src/app/globals.css`.

| What moves | Where | How |
| --- | --- | --- |
| Press | Every button, pill link and chip | Shrinks to 0.97 under the finger, 150 ms (a global rule) |
| Lift | Menu Item, Event and Post cards (the whole card is a link) | Rises 4 px on hover or keyboard focus, 200 ms |
| Reveal | The same cards and the Barista picks | Rise 2 rem and fade in as they scroll into view, tied to the scroll; still in browsers without scroll timelines |
| Page change | Every customer page (`src/app/(site)/template.tsx`) | The old page fades out in 120 ms, the new one rises 8 px and fades in over 250 ms. Only navigation animates: `router.refresh()` and Server Actions never move the page. `/manage` pages fade the same way (`src/app/manage/template.tsx`) |
| Phone menu | The header popover | Slides in from the right while the backdrop fades, 250 ms; slides back out |
| Disclosures | Every `details` (Visit FAQ, Later today, Cancel) | The answer rises in, 250 ms |
| Day and Night | The theme switch | The palettes crossfade, 250 ms (a View Transition) |
| Add to order | Menu Item page | "Added" with a check on the button for 1.6 s; the Cart count bumps (to 1.3, 300 ms) when it goes up, never on page load |
| Star Card (delight) | Home and the account page | The Stars light one by one in the order they draw the cup (350 ms each, 50 ms apart); each lit line fades in after its Stars |
| View switch (delight) | Home menu | The ring turns into a star with a small turn, 350 ms |
| Order status (delight) | Order page | Marks pop in step order (60 ms apart) on load and when the poll moves the Order on; the message rises in. Ready: the gold star spins in (500 ms) and a gold ring spreads once |
| New Order | Bar Screen | Slides in from above with a gold edge and one small pulse, 700 ms (it used to blink for 4 seconds) |

- **Quiet zones:** nothing moves on its own while the Customer chooses Options or pays (the Options on a Menu Item, the Cart, checkout, the fake payment page); there is only press feedback under the finger. The Pickup Time chips at checkout stay plain chips until batch 8.3 replaces them.
- **Never animated:** the hero, because it holds the LCP (batch 7.6); loops of any kind; parallax and scroll-jacking.
- **Reduced motion:** `prefers-reduced-motion: reduce` turns all of it off. Animations and transitions land on their final state at once, View Transitions are skipped and scroll reveals are not applied. Browser tests run this way (`playwright.config.ts`), so axe checks the settled page and never a frame mid-fade.

## 8. Imagery, icons, copy

- Photos: warm natural light, close crops of cups and pastries, people's hands rather than faces. Every stand-in photo has a row in `docs/ASSETS.md` with its source and licence (AI-generated concept images, ADR 0012).
- Room photos: AI-generated, one consistent room (the counter, window seats, evening light), empty or with hands only, each captioned "Concept image".
- Alt text describes the item as a menu would ("Iced Spanish latte with a layer of milk over espresso").
- Icons: Phosphor, one weight (regular), 20 or 24 px.
- Copy: short sentences, "you" and "we", prices as `PHP 165`, times as `9:15 AM`, dates as `Sat, Nov 8`.
- Pickup and Dine-in in one line, on `/cafe` and the menu: "Order here for pickup at the counter. Staying? Walk in and find a seat." The Order page has a "Picking up" Panel in its place while the Order is still to collect: the neighbourhood with Directions (a new tab, so the page keeps polling), today's open status, "Show code K-012 at the bar." and, for a Scheduled Pickup, Add to calendar. An As Soon As Possible Order on the bar also says how many drinks are ahead of it ("No drinks ahead of yours. You're next at the bar.").

## 9. Bar Screen

Built for a tablet behind the counter, used by Annika with wet hands and a queue waiting.

- Night palette, very high contrast, landscape first.
- Columns by Order Status: New (Placed and Paid), Making (Accepted and Preparing), Ready. Within a column, sorted by Pickup Time, then placement time.
- Each card: the Order Code in 32 px+, the Pickup Time, the Customer's first name, Lines with Options as short tags ("L · Oat · 50% · Less ice"), notes highlighted, a Pay at Pickup tag.
- One big button per card for the next step (64 px tall); cancel sits behind a confirm.
- A new Order plays a short sound (with a mute toggle); its card slides in with a gold edge and pulses once (section 7).
- Shows "Ordering Paused" and a one-tap pause and resume for Managers.
- Batch 8.10: the header links to Your account, Manage and Sold out, beside a Manila clock. An empty lane says what comes next in its own words, and an empty board says "All caught up. Salamat, team!". As soon as possible cards show when they were placed. Every tap gets feedback (a short notice in a live region). A lane puts a second card beside the first only when each keeps 17rem, about 1900 px wide and up; the tablet keeps one card per row.

## 10. Accessibility checklist (per component and per page)

- Contrast: text 4.5:1 (3:1 for 24 px+ or bold 18.66 px+), UI parts and focus rings 3:1, in both themes.
- Every control reachable and usable by keyboard; focus always visible and never hidden by sticky elements (WCAG 2.4.11).
- Targets at least 24 by 24 px (WCAG 2.5.8); 44 px for primary actions on phones.
- Option Groups are fieldsets with legends; errors are tied to fields and announced.
- Price changes, Cart updates and Order Status changes use polite live regions.
- Works at 200% text size and 320 px width without horizontal scrolling.
- Respects `prefers-reduced-motion`. Both palettes pass every check here, and the theme switch is a labelled control reachable by keyboard.
- axe runs in every Playwright page test, at phone and desktop width.

## 11. Performance budget

| Page | Budget (mobile, Lighthouse simulated) |
| --- | --- |
| Home, menu, Menu Item | Performance 90+, LCP under 2.5 s, CLS under 0.05, total blocking time under 200 ms |
| Every page | JavaScript under 170 kB compressed on first load; images in AVIF or WebP, menu photos under 80 kB each at card size; the Day paper grain is a small tiled image (under 5 kB), never a live SVG filter over the page, which is slow to paint on phones |
| Bar Screen | First data within 1 s on a tablet over Wi-Fi; each poll response under 5 kB when nothing changed |

## 12. Tailwind v4 mapping (Phase 0)

- Tokens live in `src/app/globals.css` under `@theme` (`--color-background`, `--color-primary`, `--color-night`, `--color-star`, `--font-display`, `--font-sans`, `--radius-card`), with the Night palette redefining them under `[data-theme="night"]` on `<html>`, set before first paint (section 3, ADR 0010).
- Use token classes (`bg-background`, `text-muted-foreground`, `bg-night`) everywhere; no raw hex values in components.
