# Hoshikopi

A concept cafe in Metro Manila, and the website that runs it. Customers browse the menu, customize their drink, order ahead and pick up at the counter, pay with GCash, Maya, card or at pickup, and collect Stars toward a free drink. Baristas run live Orders on a Bar Screen; the Manager edits the menu, hours, Events and Posts.

*Hoshi* is Japanese for star; *kopi* is coffee in Malay and Indonesian, close to the Filipino *kape*.

> **Concept project.** Hoshikopi is a portfolio piece, not a real business. The cafe's address, people, prices and photos are invented, and payments run in test mode only: no real money is ever taken.

## Status

Planning is complete (2026-10-30). The app is built phase by phase; the next step is Phase 0, batch 0.1 (scaffold). See [docs/07-ROADMAP.md](docs/07-ROADMAP.md).

## Stack

Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4, PostgreSQL with Prisma, Better Auth, PayMongo (test mode) behind a payment interface, Resend, Vercel. Tests: Vitest, Playwright with axe, Lighthouse.

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
| [docs/06-SETUP.md](docs/06-SETUP.md) | Prerequisites, accounts, scaffold, env vars, database, commands, Google Drive copy | Setting up or moving to a new computer |
| [docs/07-ROADMAP.md](docs/07-ROADMAP.md) | Phases 0 to 7, batches with checkboxes, exit criteria, decisions due, definition of done | Picking the next piece of work |
| [docs/08-TOOLING.md](docs/08-TOOLING.md) | Which skill fits which job, agents, ports, libraries, machine facts, prompts | Choosing how to work |
| [docs/adr/](docs/adr/) | Decisions and why (0001 to 0010) | Before changing a decision |

## Getting started

Follow [docs/06-SETUP.md](docs/06-SETUP.md). Every outside account (Neon, Vercel, PayMongo, Resend, Google) is optional at first; local stand-ins run the whole site.

## Project copy

GitHub is not used for now. The copy of the project is a git bundle on Google Drive: `G:\My Drive\Coding Projects\Personal\Hoshikopi\hoshikopi.bundle` (how to refresh and restore it: [docs/06-SETUP.md](docs/06-SETUP.md) section 8).
