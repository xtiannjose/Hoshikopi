# Hoshikopi

Concept cafe website for Metro Manila (Next.js 16 + TypeScript + Postgres): the cafe as a place to visit, menu, order ahead for pickup, Stars loyalty, Events and Posts, a Bar Screen for baristas. A portfolio project: invented details are labelled and no real money moves (ADR 0006). Planning docs are complete; code is built phase by phase from `docs/07-ROADMAP.md`.

## Start of every task

1. Find the current phase in `docs/07-ROADMAP.md` and work only on its first unchecked batch.
2. Use words exactly as defined in `GLOSSARY.md` (Menu Item, Option Group, Pickup Window, Order Code, Star, Bar Screen...). Add a new word there before using it in code.
3. Check `docs/adr/` before reopening a decision. Contradicting an ADR needs a new ADR.

## Pointers

- **Scope, or "is X in the MVP?"**: `docs/01-PRD.md` (requirement IDs such as ORD-03 link it to the roadmap).
- **Modules, routes, Order Status, payments, Pickup Windows, Stars, polling**: `docs/03-ARCHITECTURE.md`.
- **Tables, fields, constraints, seed data**: `docs/04-DATA-MODEL.md`.
- **Any UI work**: `docs/05-DESIGN-SYSTEM.md`, and run the `design-taste-frontend` skill first.
- **Environment, env vars, database, Google Drive copy**: `docs/06-SETUP.md`.
- **Which skill or tool fits a job, ports, machine facts**: `docs/08-TOOLING.md`.
- **What other cafes do**: `docs/02-RESEARCH-CAFES.md`.

## Rules that code and config cannot tell you

- **Money is integer centavos** (`PHP 165.00` is `16500`); format only through `lib/money.ts` (ADR 0002).
- **The server prices everything.** Cart and checkout recompute Base Prices, Price Deltas, Rewards and totals; client totals are ignored.
- **Orders snapshot names, Options and prices** at placement; menu edits never change a past Order.
- **Order Status changes only through `transition()`** and the table in the architecture doc section 7. Anything else is a bug.
- **Payment state comes only from verified, deduplicated webhooks**, never from the return URL. **Test Mode only:** the PayMongo adapter refuses `sk_live_` keys; `fake` refuses production domains (ADR 0003).
- **Capacity is checked under a row lock** in `placeOrder`; closing an Order gives its window counts and reserved Stars back in the same transaction (ADR 0007, 0008).
- **Modules own their tables.** Import another module only through its `index.ts`.
- **Dates:** store UTC, show and define hours in `Asia/Manila`; read "now" only through `lib/clock.ts`.
- **Next.js 16 with Cache Components** is newer than most training data: read the guide in `node_modules/next/dist/docs/` before using a Next API. Public pages are prerendered and refreshed by cache tag (`menu`, `hours`, `content`).
- **Server Components by default.** `"use client"` only for leaf components with state or browser APIs. Native form controls before library widgets.
- **The Concept Notice stays visible** on every page and at checkout.
- **Two palettes on the cafe's clock** (ADR 0010): Day 6 AM to 6 PM Manila time, Night otherwise, chosen in the browser before first paint so pages stay prerendered.

## Environment

- Windows 11, PowerShell and Git Bash. Use `npm`. In Git Bash, prefix commands with `/paths` arguments with `MSYS_NO_PATHCONV=1`.
- Local database: Docker container `hoshikopi-db` on port 5434 (`hoshikopi`, `hoshikopi_test`, `hoshikopi_e2e`); see `docs/06-SETUP.md` section 6.
- Never commit `.env*` except `.env.example`.
- Stop every server you start (ports in `docs/08-TOOLING.md` section 3).

## Test and commit discipline

- Build money, Capacity, Prep Time, Stars, Order Status and webhook handlers test-first with the `tdd` skill, against the real test database.
- A batch is done when the roadmap's definition of done (section 14) is met; look at it in the browser at 375 and 1280 px, in both palettes.
- Commits, pushes, merges into `main` and refreshing the Google Drive bundle: only when the user asks, each time. One branch per batch; merge locally with `git merge --no-ff`. Conventional Commits.
- GitHub (`origin`, https://github.com/xtiannjose/Hoshikopi) holds the project; the git bundle on Google Drive is the backup (`docs/06-SETUP.md` section 8).

## Voice

Customer copy: plain, warm, concrete, Filipino-English where natural ("Salamat! We're making your Hoshi Latte."). No em dashes or en dashes in UI copy.
