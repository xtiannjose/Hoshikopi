# Design System

Status: draft v0.1, 2026-10-30. The look and feel of Hoshikopi. Batch 1.1 builds two quick prototypes of the direction below with the same look and content (the `prototype` and `design-taste-frontend` skills): Sample A with native elements and CSS only, Sample B with library parts (`docs/07-ROADMAP.md` batch 1.1). The owner picks one, an ADR records it, and this document is then updated to match.

## 1. Design read

**"Star coffee": a neighbourhood cafe that stays open into the evening.** Warm cream and espresso by day, a deep night-sky ink for the hero, footer and Bar Screen, and one small gold star used with restraint: the logo mark, the Star Card, the "ready" moment. It should feel like a real Kapitolyo cafe with a point of view, not a template and not a theme park. Photos carry the warmth; the interface stays calm and quick to scan on a phone.

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

Each has Home at 1280 and 390 px and an interactive Hoshi Latte page at 390 px, with labelled photo slots.

| Direction | Link | What it is |
| --- | --- | --- |
| Day (the original concept, fallback) | https://claude.ai/artifact/2NM1a1FXU6wKkuxcTGMrag | Section 1.1 as written: cream paper, italic serif, printed menu, typewriter prices. Close to Flora; kept as the safe option. |
| Night (experimental) | https://claude.ai/artifact/Q8W4V38NB5JdyH3m8sFJC7 | Hoshikopi's own layout on night ink (light mode as a switch), with Day's type (section 4: italic serif headings, Plus Jakarta Sans, Courier Prime), pickup times in the hero, a menu the Customer switches between a full list (default) and photo cards by Category, the Star Card as a nine-star constellation that draws a cup, and Day's upcoming Event with a Latest post column, both with photos. |

The owner picks a direction before batch 1.1; the two batch 1.1 samples then follow it. If Night wins, sections 3 and 7 are rewritten to match.

## 2. Principles

1. **The menu is the product.** Big photos, clear prices, Options one tap away. Nothing decorative stands between a Customer and "Add to order".
2. **One accent.** Gold appears in at most one place per screen. Stars are earned, not sprinkled.
3. **Phone first, thumb first.** Primary actions sit in the bottom third; the Cart is reachable from every page.
4. **Native where it works.** Native radio buttons, checkboxes, selects and date inputs, styled, before custom widgets (a lesson from the iOne website).
5. **Calm motion.** Short, meaningful transitions; nothing loops on screen while ordering; all motion respects reduced motion.
6. **Words do the work.** Plain, warm, Filipino-English where natural ("Salamat! We're making your Hoshi Latte."). No em dashes in UI copy.

## 3. Colour tokens

Values are starting points for the Phase 1 prototypes; they must pass the contrast checks in section 10.

| Token | Light (day) | Use |
| --- | --- | --- |
| `--background` | cream `#FBF6EE` | Page background |
| `--foreground` | espresso `#2B1D14` | Body text |
| `--muted` | latte `#EFE5D6` | Cards, inputs, Sold Out wash |
| `--muted-foreground` | roast `#6E5A4B` | Secondary text (AA on `--background` and `--muted`) |
| `--primary` | kopi `#5A3420` | Primary buttons, links |
| `--primary-foreground` | cream `#FBF6EE` | Text on primary |
| `--night` | ink `#141B2E` | Hero, footer, Bar Screen background |
| `--night-foreground` | moonlight `#EEF0F7` | Text on night |
| `--star` | gold `#E8B74A` | Logo star, Star Card fill, Ready badge on night; never for text on cream |
| `--border` | `#E2D6C4` | Hairlines, input borders |
| `--ring` | `#2F6FD6` | Focus ring (visible on cream and on night) |
| `--success` | `#2E7D4F` | Paid, Picked Up |
| `--warning` | `#B26A00` | Preparing, Ordering Paused |
| `--destructive` | `#B3261E` | Cancel, errors |

A dark theme maps `--background` to `--night` and lifts surfaces with lighter inks; it follows `prefers-color-scheme` and a toggle saved per browser. The Bar Screen always uses the night palette.

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
| Home menu section | The Flora-style printed menu (section 1.1): Categories side by side, Menu Item names left, prices right in the mono, Price Deltas listed under a Category, one photo beside the list; each name links to its Menu Item page; Sold Out items show "Sold out today" |
| Menu Item card | Used on `/menu`. Photo (4:3), name, one-line description, price, badges; Sold Out greys the photo and replaces the price with "Sold out today" |
| Option picker | Each Option Group is a `fieldset` with a `legend`; single choice uses styled native radios as large chips; multi choice uses checkboxes; the Price Delta sits on the chip ("Oat +35"); the running price updates in a live region |
| Quantity stepper | Two 44 px buttons around the number; long-press free |
| Cart button and drawer | A floating pill with the count and total; the drawer is a native `dialog` |
| Pickup Time picker | "As soon as possible: ready in about 10 min" first, then today's windows as chips; full windows are not shown (ordering for tomorrow comes in V1) |
| Payment Method list | Radio cards: GCash, Maya, Card, Pay at Pickup, each with its logo or icon and a one-line note; a "Test Mode" tag on online methods |
| Order status timeline | Placed, Paid, Accepted, Preparing, Ready, Picked Up; the current step is announced politely; Ready uses the gold star |
| Star Card | Nine circles; filled ones show a gold star; a Reward appears when all nine are filled |
| Event card, Post card | Date block, photo, title, one line; Events show "Free" or a price |
| Concept Notice | A slim footer line and a short note on checkout: "Hoshikopi is a concept cafe. Orders and payments here are for demonstration." |
| Bar Screen card | See section 9 |

Library components come through the shadcn CLI only when a native element cannot do the job; each one must earn its place on a page. Batch 1.1 Sample B tries decorative parts from the iOne research (`C:\Users\cjose\IONE-WEBSITE\docs\DESIGN-LIBS.md`); forms and the Cart drawer stay native in both samples.

## 7. Motion

- CSS first: transitions, `@starting-style` for entering elements, View Transitions for the menu-to-item navigation where supported. No animation library unless a later ADR adds one; batch 1.1 Sample B tries Motion (`motion`) and its ADR decides.
- Durations 150 to 250 ms for UI, up to 600 ms for the Star Card fill; ease-out curves.
- The only "delight" moments: a Star filling in after pickup, and the Ready step on the status page. Both are skipped with reduced motion.
- Nothing animates while the Customer is choosing Options or paying.

## 8. Imagery, icons, copy

- Photos: warm natural light, close crops of cups and pastries, people's hands rather than faces. Every stand-in photo has a row in `docs/ASSETS.md` with its source and licence (stock, own shots or AI-generated, decided in Phase 1).
- Alt text describes the item as a menu would ("Iced Spanish latte with a layer of milk over espresso").
- Icons: Phosphor, one weight (regular), 20 or 24 px.
- Copy: short sentences, "you" and "we", prices as `PHP 165`, times as `9:15 AM`, dates as `Sat, Nov 8`.

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
- Respects `prefers-reduced-motion` and `prefers-color-scheme`.
- axe runs in every Playwright page test, at phone and desktop width.

## 11. Performance budget

| Page | Budget (mobile, Lighthouse simulated) |
| --- | --- |
| Home, menu, Menu Item | Performance 90+, LCP under 2.5 s, CLS under 0.05, total blocking time under 200 ms |
| Every page | JavaScript under 170 kB compressed on first load; images in AVIF or WebP, menu photos under 80 kB each at card size |
| Bar Screen | First data within 1 s on a tablet over Wi-Fi; each poll response under 5 kB when nothing changed |

## 12. Tailwind v4 mapping (Phase 0)

- Tokens live in `src/app/globals.css` under `@theme` (`--color-background`, `--color-primary`, `--color-night`, `--color-star`, `--font-display`, `--font-sans`, `--radius-card`), with the dark theme redefining them under a `.dark` class and `prefers-color-scheme`.
- Use token classes (`bg-background`, `text-muted-foreground`, `bg-night`) everywhere; no raw hex values in components.
