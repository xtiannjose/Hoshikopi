# Design System

Status: draft v0.1, 2026-10-30. The look and feel of Hoshikopi. Batch 1.1 builds two quick prototypes of the direction below with the same look and content (the `prototype` and `design-taste-frontend` skills): Sample A with native elements and CSS only, Sample B with library parts (`docs/07-ROADMAP.md` batch 1.1). The owner picks one, an ADR records it, and this document is then updated to match.

## 1. Design read

**"Star coffee": a neighbourhood cafe that stays open into the evening.** Warm cream and espresso by day and deep night-sky ink by night, switching with the cafe's clock (section 3), and one small gold star used with restraint: the logo mark, the Star Card, the "ready" moment. It should feel like a real Kapitolyo cafe with a point of view, not a template and not a theme park. Photos carry the warmth; the interface stays calm and quick to scan on a phone.

**Owner's brief (2026-10-30): very modern and aesthetic.** It should look like a design-led cafe people screenshot and share, not a small-business template: confident type, generous space, large photography, polished details. "Star coffee" stays; it is expressed in a modern way.

Reference mood: paper stamp cards, a window seat at dusk, a well-designed cafe you would photograph.

### 1.1 Reference sites (shortlist, owner to pick before batch 1.1)

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
- **Fonts: try a typewriter mono as a third family** (section 4); batch 1.1 shows it in both samples.
- **Menu: both.** Home gets a printed-menu section; `/menu` keeps photo cards (section 6).

We redraw everything ourselves: no Flora photos, drawings, copy or logo.

### 1.2 Wireframes (claude.ai canvases, 2026-10-30)

Each has the same twelve boards, with labelled photo slots: Home at 1280 and 390 px; at 390 px the Hoshi Latte page, the Visit page (`/cafe`), Cart and checkout, Order status, the Star Card and account page (`/account`), Events, a Post and About this concept (`/concept`); the Bar Screen on a 1194 px tablet; and the Manager pages at 1280 px (Today with Refunds and Ordering Paused, the Menu editor with Sold Out, Hours and capacity). Preview settings: Home's pickup card (sample time, live clock, closing soon, closed, Ordering Paused); Order status for each Order Status; the account page for a Member with 5 Stars, a Reward ready, a new Member or signed out; the Manager pages for each section. Not wireframed: Cafe details, Events, Posts and Staff forms in `/manage`, and V1 features.

| Direction | Link | What it is |
| --- | --- | --- |
| Day | https://claude.ai/artifact/2NM1a1FXU6wKkuxcTGMrag | The chosen layout (next row) in the Day palette, 6 AM to 6 PM: cream paper with grain, espresso text, kopi buttons, latte cards, kopi line art. The earlier Flora-style Day layout is in this canvas's version history. |
| Night | https://claude.ai/artifact/Q8W4V38NB5JdyH3m8sFJC7 | The chosen layout in the Night palette, 6 PM to 6 AM. Both canvases hold the same boards and a Theme setting (Day, Night, or Auto by Manila time). The layout: Hoshikopi's own, with Day's type (section 4: italic serif headings, Plus Jakarta Sans, Courier Prime), pickup times in the hero, Barista picks this week right after it, Day's hand-drawn dividers in slate, a menu the Customer switches (with a List and Photos switch drawn as two stars on a dashed thread) between a full list (default) and photo cards by Category, the Star Card as a nine-star constellation that draws a cup, and Day's upcoming Event with a Latest post column, both with photos. |

**Owner's decision (2026-10-30):** Night's layout and content, with Day's colours and paper grain by day and Night's colours by night ([ADR 0010](adr/0010-theme-follows-manila-time.md)). Section 3 holds both palettes; the batch 1.1 samples build this.

## 2. Principles

1. **The menu is the product.** Big photos, clear prices, Options one tap away. Nothing decorative stands between a Customer and "Add to order".
2. **One accent.** Gold appears in at most one place per screen. Stars are earned, not sprinkled.
3. **Phone first, thumb first.** Primary actions sit in the bottom third; the Cart is reachable from every page.
4. **Native where it works.** Native radio buttons, checkboxes, selects and date inputs, styled, before custom widgets (a lesson from the iOne website).
5. **Calm motion.** Short, meaningful transitions; nothing loops on screen while ordering; all motion respects reduced motion.
6. **Words do the work.** Plain, warm, Filipino-English where natural ("Salamat! We're making your Hoshi Latte."). No em dashes in UI copy.

## 3. Colour tokens

Values are starting points for the Phase 1 prototypes; they must pass the contrast checks in section 10. Two palettes share every token: **Day** (cream paper, kopi brown, paper grain) and **Night** (night ink, moonlight). The Day column comes from the Day wireframe, the Night column from the main wireframe.

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
| `--night`, `--night-foreground` | ink, moonlight | ink, moonlight | Bar Screen, in both palettes |
| `--ring` | `#2F6FD6` | `#2F6FD6` | Focus ring (visible on cream and on ink) |
| `--success` | `#256B42` | `#6FCF97` | Paid, Picked Up, "Open now" (4.5:1 on `--muted` too) |
| `--warning` | `#8A4F00` | `#F0A35E` | Preparing, Ordering Paused, the Last Order countdown (4.5:1 on `--muted` too) |
| `--destructive` | `#B3261E` | `#FF8A80` | Cancel, errors |

**Which palette shows** ([ADR 0010](adr/0010-theme-follows-manila-time.md)): Day from 6:00 AM to 5:59 PM Manila time, Night from 6:00 PM to 5:59 AM, for every visitor wherever they are; the site follows the cafe's sky. A switch in the header (Auto, Day, Night) pins one, saved per browser; Auto is the default. The device's light or dark setting is not used. The Bar Screen always uses the night palette.

## 4. Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display and headings | Fraunces (variable, soft optical sizes) | Warm serif with character for the menu and hero; open font licence |
| Text and UI | Plus Jakarta Sans (variable) | Clear at small sizes; made by an Indonesian foundry, a nod to kopi; open font licence |
| Order Codes and prices in tables | Plus Jakarta Sans with tabular figures | `font-variant-numeric: tabular-nums` |
| Typewriter accents (to try in batch 1.1) | Courier Prime, regular only | Prices in the printed-menu section, short notes under items, dates, small label buttons (the Flora feel, section 1.1); never body text; open font licence |

Self-hosted through `next/font`, `display: swap`: two variable families, plus the mono at one weight if batch 1.1 keeps it. Scale (rem): 0.875, 1, 1.125, 1.25, 1.5, 2, 2.75, 3.5. Body 1 rem (16 px) at minimum; line length 60 to 75 characters for Posts.

## 5. Shape, space, elevation

- Radius: 12 px for cards and inputs, full pills for chips and the Cart button.
- Spacing on a 4 px grid; page gutter 16 px on phones, 24 px on tablets, 32 px on desktop.
- Elevation through tone (cream to latte) and one soft shadow for floating elements (Cart button, drawers). No glassmorphism.

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
| Menu Item card | Used on `/menu`. Photo (4:3), name, one-line description, price, badges; Sold Out greys the photo and replaces the price with "Sold out today" |
| Option picker | Each Option Group is a `fieldset` with a `legend`; single choice uses styled native radios as large chips; multi choice uses checkboxes; the Price Delta sits on the chip ("Oat +35"); the running price updates in a live region |
| Allergen line | Under the description on the Menu Item page: an info icon and "Contains: milk. Almond milk adds tree nuts. Our kitchen also handles gluten and egg." in the mono; "No common allergens" when empty (PRD MENU-07) |
| Pairing (V1) | Under the Option Groups: "Goes well with", one small card (photo, name, price, an add button) (PRD MENU-08) |
| Quantity stepper | Two 44 px buttons around the number; long-press free |
| Cart button and drawer | A floating pill with the count and total; the drawer is a native `dialog` |
| Pickup Time picker | "As soon as possible: ready in about 10 min" first, then today's windows as chips; full windows are not shown (ordering for tomorrow comes in V1) |
| Payment Method list | Radio cards: GCash, Maya, Card, Pay at Pickup, each with its logo or icon and a one-line note; a "Test Mode" tag on online methods |
| Order status timeline | Placed, Paid, Accepted, Preparing, Ready, Picked Up; the current step is announced politely; Ready uses the gold star |
| Star Card | "Nine Stars make a cup": a constellation of nine points that draws a cup. Earned Stars are gold stars (with `--star-edge` by day) joined by `--lit` lines; the rest are small rings on dashed `--input` lines. A Reward appears when all nine are lit |
| Event card, Post card | Date block, photo, title, one line; Events show "Free" or a price |
| Concept Notice | A slim footer line and a short note on checkout: "Hoshikopi is a concept cafe. Orders and payments here are for demonstration." It links to `/concept` |
| Bar Screen card | See section 9 |

Library components come through the shadcn CLI only when a native element cannot do the job; each one must earn its place on a page. Batch 1.1 Sample B tries decorative parts from the iOne research (`C:\Users\cjose\IONE-WEBSITE\docs\DESIGN-LIBS.md`); forms and the Cart drawer stay native in both samples.

## 7. Motion

- CSS first: transitions, `@starting-style` for entering elements, View Transitions for the menu-to-item navigation where supported. No animation library unless a later ADR adds one; batch 1.1 Sample B tries Motion (`motion`) and its ADR decides.
- Durations 150 to 250 ms for UI, up to 600 ms for the Star Card fill; ease-out curves.
- The only "delight" moments: a Star lighting up on the Star Card after pickup, the Ready step on the status page, and the ring turning into a star when a Pickup Window or the menu View is picked (350 ms). All are skipped with reduced motion.
- Nothing animates while the Customer is choosing Options or paying.

## 8. Imagery, icons, copy

- Photos: warm natural light, close crops of cups and pastries, people's hands rather than faces. Every stand-in photo has a row in `docs/ASSETS.md` with its source and licence (stock, own shots or AI-generated, decided in Phase 1).
- Room photos: AI-generated, one consistent room (the counter, window seats, evening light), empty or with hands only, each captioned "Concept image".
- Alt text describes the item as a menu would ("Iced Spanish latte with a layer of milk over espresso").
- Icons: Phosphor, one weight (regular), 20 or 24 px.
- Copy: short sentences, "you" and "we", prices as `PHP 165`, times as `9:15 AM`, dates as `Sat, Nov 8`.
- Pickup and Dine-in in one line, on `/cafe`, the menu and the Order page: "Order here for pickup at the counter. Staying? Walk in and find a seat."

## 9. Bar Screen

Built for a tablet behind the counter, used by Jomar with wet hands and a queue in front of him.

- Night palette, very high contrast, landscape first.
- Columns by Order Status: New (Placed and Paid), Making (Accepted and Preparing), Ready. Within a column, sorted by Pickup Time, then placement time.
- Each card: the Order Code in 32 px+, the Pickup Time, the Customer's first name, Lines with Options as short tags ("L · Oat · 50% · Less ice"), notes highlighted, a Pay at Pickup tag.
- One big button per card for the next step (64 px tall); cancel sits behind a confirm.
- A new Order plays a short sound (with a mute toggle) and pulses its card once.
- Shows "Ordering Paused" and a one-tap pause and resume for Managers.

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
