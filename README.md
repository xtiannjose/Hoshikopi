# Hoshikopi

A concept cafe in Metro Manila, and the website that runs it. The site sells the place and the menu: Customers see the space and plan a visit, browse the menu, customize their drink, order ahead and pick up at the counter, pay with GCash, Maya, card or at pickup, and collect Stars toward a free drink. Baristas run live Orders on a Bar Screen; the Manager edits the menu, hours, the cafe's details, Events and Posts. The look follows the cafe's clock: cream paper by day, night sky from 6 PM.

*Hoshi* is Japanese for star; *kopi* is coffee in Malay and Indonesian, close to the Filipino *kape*.

> **Concept project.** Hoshikopi is a portfolio piece, not a real business. The cafe's address, people, prices and photos are invented, and payments run in test mode only: no real money is ever taken.

## Status

Phases 0 to 6 (MVP and V1) and Phase 8 (improvements) are built, and the demo is live at https://hoshikopi.vercel.app (Vercel and Neon, Test Mode payments on the `fake` provider). Phase 7, audit fixes: the November audit is finished, with every finding double-checked and ranked in [docs/audit/2026-11-13.md](docs/audit/2026-11-13.md). Now: batches 7.7 to 7.11 from the audit (7.5 finished 2026-11-14), then Phase 9, the portfolio review. See [docs/07-ROADMAP.md](docs/07-ROADMAP.md) section 0.

## Stack

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, PostgreSQL with Prisma (Docker locally, Neon hosted), Better Auth (email link, Google), a payment interface with a `fake` Test Mode checkout and a PayMongo adapter, email through Resend's API when a key is set, Vercel with Vercel Blob. Tests: Vitest, Playwright with axe, Lighthouse.

## Documents

| Document | What it holds | Read it when |
| --- | --- | --- |
| [CLAUDE.md](CLAUDE.md) | Rules and pointers for every working session | Starting any task |
| [GLOSSARY.md](GLOSSARY.md) | The words the product, code and database use | A term is unclear, or you name something |
| [docs/01-PRD.md](docs/01-PRD.md) | Goals, assumptions, personas, scope by release, requirements with IDs, risks | Deciding what is in or out |
| [docs/02-RESEARCH-CAFES.md](docs/02-RESEARCH-CAFES.md) | What other cafe sites and ordering apps do, with sources and candidate features | Designing a feature |
| [docs/03-ARCHITECTURE.md](docs/03-ARCHITECTURE.md) | Modules, routes, ordering, Order Status, payments, Pickup Windows, Stars, live updates, security, testing | Writing code |
| [docs/04-DATA-MODEL.md](docs/04-DATA-MODEL.md) | Tables, columns, invariants, seed data, migration policy | Touching the database |
| [docs/05-DESIGN-SYSTEM.md](docs/05-DESIGN-SYSTEM.md) | The "star coffee" look: colours, type, components, motion, Bar Screen, accessibility, budgets | Any UI work |
| [docs/06-SETUP.md](docs/06-SETUP.md) | Prerequisites, accounts, getting the code, libraries, env vars, database, commands, GitHub, demo deploy | Setting up or moving to a new computer |
| [docs/07-ROADMAP.md](docs/07-ROADMAP.md) | Phases 0 to 9, batches with checkboxes, exit criteria, decisions, definition of done | Picking the next piece of work |
| [docs/08-TOOLING.md](docs/08-TOOLING.md) | Which skill fits which job, agents, ports, libraries, machine facts, prompts | Choosing how to work |
| [docs/ASSETS.md](docs/ASSETS.md) | Every shipped file that is not code, its source and licence; the concept images still to make | Adding a font, image or other asset |
| [docs/audit/](docs/audit/) | The November audit: findings, each checker's verdict, and the ranked backlog | Working on Phase 7 |
| [docs/adr/](docs/adr/) | Decisions and why (0001 to 0015) | Before changing a decision |

## Getting started

Follow [docs/06-SETUP.md](docs/06-SETUP.md). Every outside account (Neon, Vercel, PayMongo, Resend, Google) is optional at first; local stand-ins run the whole site.

## Project copy

The project lives on GitHub: https://github.com/xtiannjose/Hoshikopi.
