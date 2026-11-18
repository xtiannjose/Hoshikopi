# Hoshikopi

> **In plain words:** Hoshikopi is a website for a concept cafe. Customers order coffee ahead and pick it up. Baristas see the Orders on a tablet behind the counter. The Manager runs the menu and the cafe from the same site. It is a finished portfolio project: it works end to end, but no real money ever moves.
>
> **Who should read it:** everyone, first.
> **Last checked:** 2026-11-18.

A concept cafe, and the website that runs it. The site does two jobs:

- **It sells the place.** Customers see the room, the menu and the Opening Hours, and plan a visit.
- **It runs the counter.** Customers choose their drink and its Options, order ahead and pick up at the counter. They pay with GCash, Maya, a card or at pickup, and collect Stars toward a free drink. Baristas work through the Orders on a Bar Screen. The Manager edits the menu, the hours, the cafe's details, Events and Posts.

The look follows the cafe's clock: cream paper by day, night sky from 6 PM Manila time.

*Hoshi* is Japanese for star. *Kopi* is coffee in Malay and Indonesian, close to the Filipino *kape*.

> **Concept project.** Hoshikopi is a portfolio piece, not a real business. The cafe's address, people, prices and photos are invented. Payments run in Test Mode only (practice payments), so no real money is ever taken.

| | |
| --- | --- |
| ![Home in the Day palette](docs/screenshots/home-day.jpg) | ![Home in the Night palette](docs/screenshots/home-night.jpg) |
| ![The Bar Screen](docs/screenshots/bar-night.jpg) | ![An Order's live status page on a phone](docs/screenshots/order-phone-night.jpg) |

## Start here

**New here? Open the [docs map](docs/README.md).** It has a reading path for each kind of reader, a list of every document, and the coding words explained for beginners.

| You are | Read first | Then |
| --- | --- | --- |
| Curious, a reviewer or a recruiter | [Case study](docs/CASE-STUDY.md) | [Demo script](docs/DEMO-SCRIPT.md), then try the [live site](https://hoshikopi.vercel.app) |
| Working at the cafe (Barista, Manager) | [Staff guide](docs/STAFF-GUIDE.md) | [Glossary](GLOSSARY.md), for any word that is unclear |
| Taking over the project | [Handoff guide](docs/HANDOFF.md) | [Roadmap](docs/07-ROADMAP.md), section 0 |
| New to coding, changing the code | [Docs map](docs/README.md), "Coding words" | [Setup](docs/06-SETUP.md) |
| A developer | [Setup](docs/06-SETUP.md) | [CLAUDE.md](CLAUDE.md), then [Architecture](docs/03-ARCHITECTURE.md) |

## Where it stands

It is live at https://hoshikopi.vercel.app. Vercel hosts the site and Neon hosts the database. Payments run in Test Mode on the site's built-in pretend provider, called `fake`. The live site sends no email until the project has a domain, so visitors sign in with Google.

| Phase | What | Status |
| --- | --- | --- |
| 0 to 10 | Every planned feature, a full audit and all its fixes, the case study and the demo script | Done |
| 11 | The handoff docs, and fixes for every finding of a second full check (pull requests #111 to #120) | Done 2026-11-17 |
| 12 | The owner's requests: headers that stay at the top, photos for Events and Posts, the staff menu with a List and Photos switch, Adjust Stars with the Member's Star Card | Done 2026-11-18 (#121 to #128) |

New features beyond these are on hold. For where things stand on any day, see the [roadmap](docs/07-ROADMAP.md), section 0.

## What it is built with

| Part | What it does for the site |
| --- | --- |
| Next.js 16 and React 19 | Build the pages and run the server code. Public pages are built ahead of time, so they load fast. |
| TypeScript | JavaScript that also checks the kinds of values, so many mistakes show up before the code runs |
| Tailwind CSS 4 | The styling: colours, spacing and the Day and Night palettes |
| PostgreSQL with Prisma | The database, and the tool that reads it and changes its shape. Docker runs it on a developer's computer; Neon hosts it online. |
| Better Auth | Sign-in with an email link or Google. Staff also enter a 6-digit code, the Second Factor. |
| `fake` and PayMongo | A Test Mode checkout built into the site, and a PayMongo connector ready for test keys |
| Resend | Sends emails once a key is set. Until then, emails show in the terminal on a developer's computer. |
| Vercel and Vercel Blob | Hosting, the daily job, and the storage for uploaded photos |
| zod, sharp | Check every input; re-encode uploaded photos without their location data |
| Vitest, Playwright with axe, Lighthouse | Tests of the rules against a real database, tests in a real browser with accessibility checks, and speed scores |
| GitHub Actions and Dependabot | Run the checks on every pull request; propose library updates every week |

Every term here is explained in the [docs map](docs/README.md#4-coding-words-you-will-meet).

## Run it on your computer

Follow [Setup](docs/06-SETUP.md). You need no outside accounts at first: stand-ins on your computer run the whole site.

## Where the project lives

The code is on GitHub: https://github.com/xtiannjose/Hoshikopi. It is public and it is the project's only copy, so nothing secret ever goes in it.
