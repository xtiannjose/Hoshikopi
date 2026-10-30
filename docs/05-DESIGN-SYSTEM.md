# Design System

Status: draft v0.1, 2026-10-30. The look and feel of Hoshikopi. Phase 1 builds two quick prototypes of the direction below (the `prototype` and `design-taste-frontend` skills), the owner picks one, and an ADR records it; this document is then updated to match.

## 1. Design read

**"Star coffee": a neighbourhood cafe that stays open into the evening.** Warm cream and espresso by day, a deep night-sky ink for the hero, footer and Bar Screen, and one small gold star used with restraint: the logo mark, the Star Card, the "ready" moment. It should feel like a real Kapitolyo cafe with a point of view, not a template and not a theme park. Photos carry the warmth; the interface stays calm and quick to scan on a phone.

Reference mood: handwritten chalkboard menus, paper stamp cards, kraft cups, a window seat at dusk.

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

Self-hosted through `next/font`, two families, variable axes only, `display: swap`. Scale (rem): 0.875, 1, 1.125, 1.25, 1.5, 2, 2.75, 3.5. Body 1 rem (16 px) at minimum; line length 60 to 75 characters for Posts.

## 5. Shape, space, elevation

- Radius: 12 px for cards and inputs, full pills for chips and the Cart button.
- Spacing on a 4 px grid; page gutter 16 px on phones, 24 px on tablets, 32 px on desktop.
- Elevation through tone (cream to latte) and one soft shadow for floating elements (Cart button, drawers). No glassmorphism.

## 6. Components

| Component | Notes |
| --- | --- |
| Menu Item card | Photo (4:3), name, one-line description, price, badges; Sold Out greys the photo and replaces the price with "Sold out today" |
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

Library components come through the shadcn CLI only when a native element cannot do the job; each one must earn its place on a page.

## 7. Motion

- CSS first: transitions, `@starting-style` for entering elements, View Transitions for the menu-to-item navigation where supported. No animation library unless a later ADR adds one.
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
