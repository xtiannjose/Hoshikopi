# Start here: the Hoshikopi docs

> **In plain words:** this page is the map of every Hoshikopi document. Pick the path that fits you, read those documents in order, and come back here when you need another one. The last part explains the coding words the other documents use, for anyone new to coding.
>
> **Who should read it:** everyone, before any other document.
> **Last checked:** 2026-11-18.

## Contents

1. [Pick your path](#1-pick-your-path)
2. [Every document](#2-every-document)
3. [How each document is laid out](#3-how-each-document-is-laid-out)
4. [Coding words you will meet](#4-coding-words-you-will-meet)
5. [Where to go next](#5-where-to-go-next)

## 1. Pick your path

Find the line that fits you and read its documents in order. You do not need the others.

| You want to... | Read these, in order |
| --- | --- |
| **Know what Hoshikopi is** (anyone, a recruiter, a reviewer) | 1. [README](../README.md) 2. [Case study](CASE-STUDY.md) 3. [Demo script](DEMO-SCRIPT.md), then try the [live site](https://hoshikopi.vercel.app) |
| **Run the cafe on the site** (a Barista or the Manager) | 1. [Staff guide](STAFF-GUIDE.md) 2. [Glossary](../GLOSSARY.md), for any word that is unclear |
| **Take over the project** (a new owner or project manager) | 1. [Handoff guide](HANDOFF.md) 2. [Roadmap](07-ROADMAP.md), section 0 3. [Audit index](audit/README.md) |
| **Change the code, new to coding** | 1. [Coding words](#4-coding-words-you-will-meet), below 2. [Setup](06-SETUP.md), to run the site on your computer 3. [Glossary](../GLOSSARY.md) 4. [Architecture](03-ARCHITECTURE.md), sections 1 to 3 5. [Tooling](08-TOOLING.md) |
| **Change the code, already a developer** | 1. [Setup](06-SETUP.md) 2. [CLAUDE.md](../CLAUDE.md), the project's rules 3. [Architecture](03-ARCHITECTURE.md) 4. [Data model](04-DATA-MODEL.md) 5. [Decisions (ADRs)](adr/README.md) |
| **Change how it looks** | 1. [Design system](05-DESIGN-SYSTEM.md) 2. [Assets](ASSETS.md), for fonts and images |

## 2. Every document

Short takes under 10 minutes to read, medium 10 to 30, long more than 30. You rarely need a long one from start to end: use its contents list.

| Document | What it holds | For | Length |
| --- | --- | --- | --- |
| [README](../README.md) | What Hoshikopi is, screenshots, where it stands | Everyone | Short |
| [Handoff guide](HANDOFF.md) | Taking over: the services the site runs on, who holds the keys, routine care, what to do when something breaks, what is left | Owner, project manager | Medium |
| [Staff guide](STAFF-GUIDE.md) | How Baristas and the Manager use the Bar Screen and `/manage`, page by page | Staff | Long |
| [Glossary](../GLOSSARY.md) | The fixed words for the cafe's parts (Menu Item, Order Code, Star...) | Everyone | Medium |
| [PRD](01-PRD.md) | What the site must do: goals, the people it serves, every requirement with an ID | Owner, developer | Medium |
| [Research](02-RESEARCH-CAFES.md) | What other cafe websites and ordering apps do, with sources | Designer, developer | Long |
| [Architecture](03-ARCHITECTURE.md) | How the code is organised and how ordering, payments and Stars work inside | Developer | Long |
| [Data model](04-DATA-MODEL.md) | Every database table and the rules its data follows | Developer | Medium |
| [Design system](05-DESIGN-SYSTEM.md) | The look: colours, type, components, motion, accessibility | Designer, developer | Long |
| [Setup](06-SETUP.md) | Running the site on a computer, every setting, the live site, backups | Developer, owner | Medium |
| [Roadmap](07-ROADMAP.md) | The plan: every phase and batch, what is done, what is next | Everyone | Long |
| [Tooling](08-TOOLING.md) | Which tool fits which job, ports, the two computers | Developer | Short |
| [Assets](ASSETS.md) | Every font and image, where it came from, its licence | Designer, developer | Short |
| [Case study](CASE-STUDY.md) | The problem, what was built, the decisions, the quality work | Reviewer, recruiter | Medium |
| [Metrics](METRICS.md) | The success targets, measured | Reviewer, owner | Short |
| [Demo script](DEMO-SCRIPT.md) | The two-minute demo, step by step, with what to say | Anyone showing it | Short |
| [Decisions (ADRs)](adr/README.md) | Every big decision in one sentence, linking the note that records why | Developer | Short (index) |
| [Audits](audit/README.md) | The two full checks of the project, what they found and how each finding was fixed | Owner, developer | Short (index) |
| [CLAUDE.md](../CLAUDE.md) | The rules an AI coding assistant follows in this project | Developer | Short |

## 3. How each document is laid out

Every document opens the same way, so you always know where to look:

1. **In plain words:** two to four sentences on what the document is for.
2. **Who should read it,** and when.
3. **Last checked:** the date someone last confirmed it matches the site.
4. **Contents,** in the longer documents: a numbered list of sections that link to them.

Inside, the writing follows a few habits:

- Short sentences, one idea each.
- Steps you follow are numbered; lists you scan are bullets; facts you compare are tables.
- A coding word is explained the first time a document uses it. If one is not, it is in [section 4](#4-coding-words-you-will-meet).
- The cafe's own words (Menu Item, Pickup Time, Star) are capitalised and mean exactly what the [Glossary](../GLOSSARY.md) says.
- Paths and commands are in `code style`. Copy them exactly: one changed character breaks them.

## 4. Coding words you will meet

New to coding? These are the words the documents use most, in plain words. The cafe's own words (Order, Star, Bar Screen) are in the [Glossary](../GLOSSARY.md) instead.

### The website

| Word | What it means here |
| --- | --- |
| **Browser** | The app you view websites in: Chrome, Safari, Edge. |
| **Server** | A computer that builds pages and answers the browser. Hoshikopi's runs on Vercel. |
| **Page** | One address on the site, like `/menu` or `/manage/stars`. |
| **Route** | The code behind one address. "The `/menu` route" means the code that builds the menu page. |
| **Component** | A reusable piece of a page, such as a button or the Star Card, written once and used in many places. |
| **Server Component, Client Component** | A component built on the server (most of the site, so pages load fast) or one that runs in the browser too (only the parts you click or type into). |
| **Server Action** | Code that runs on the server when you press a button or send a form, for example "Save Menu Item". |
| **Framework** | A ready-made foundation for building websites. Hoshikopi uses **Next.js**, built on **React**. |
| **Prerendered** | Built ahead of time and kept ready, so it shows instantly. Most public pages are prerendered. |
| **Cache** | A saved copy kept to answer faster. When the data changes, the copy is refreshed. |
| **localhost** | Your own computer acting as the server, while you work on the site. `localhost:3000` is the site running on your computer. |
| **Port** | The number after the colon in `localhost:3000`. Each running program uses its own. |

### The code and its history

| Word | What it means here |
| --- | --- |
| **Code** | The instructions that make up the site. Hoshikopi's is written in **TypeScript** (JavaScript that also checks the kinds of values, so many mistakes show up before the site runs). |
| **File, folder** | The code lives in files, grouped in folders. `src/` holds the site's code; `docs/` holds these documents. |
| **Module** | A folder of code that owns one part of the cafe, such as `menu`, `ordering` or `loyalty` (Stars). |
| **Library, package** | Code someone else wrote that the site uses, such as the sign-in library. **npm** installs them. |
| **Git** | The tool that records every change to the files, so any earlier version can be seen or brought back. |
| **Repository (repo)** | The project's folder together with its whole Git history. Hoshikopi's is on **GitHub**. |
| **Commit** | One saved change in Git, with a message saying what changed and why. |
| **Branch** | A separate line of work, so a change can be made and checked without touching the main version, called `main`. |
| **Pull request (PR)** | A request to bring a branch into `main`. Others can review it, and the checks run on it, before it is merged. |
| **Merge** | Bringing a branch's changes into another branch, usually `main`. |
| **Terminal** | The window where you type commands, such as PowerShell on Windows. |
| **Command** | A line you type in the terminal, like `npm run dev`, which starts the site on your computer. |

### Data

| Word | What it means here |
| --- | --- |
| **Database** | Where the site keeps its data: the menu, Orders, Stars, accounts. Hoshikopi uses **PostgreSQL** (Postgres). |
| **Table, row, column** | A database is made of tables, like spreadsheets: one table per kind of thing (menu items, orders), one row per item, one column per detail (name, price). |
| **Migration** | A script that changes the database's shape, such as adding a column. They run in order, and each is kept forever. |
| **Seed** | The sample data a fresh database starts with: the menu, the demo accounts, the sample Events. |
| **Prisma** | The tool the code uses to read and change the database. |
| **Centavos** | Money is stored in whole centavos, so PHP 165.00 is stored as `16500`. This avoids rounding errors. |

### Running it online

| Word | What it means here |
| --- | --- |
| **Deploy** | Putting a new version of the site online. Vercel deploys by itself when a pull request is merged into `main`. |
| **Vercel** | The company that hosts the live site and runs its server code. |
| **Neon** | The company that hosts the live database. |
| **Blob storage** | Vercel's online storage for uploaded files. Menu, Event and Post photos go there. |
| **Docker** | A program that runs the database on your own computer, so you can work without touching the live one. |
| **Environment variable** | A setting given to the site from outside its code, such as a database address or a secret key. They live in `.env.local` on a computer and in Vercel's settings online, never in the code. |
| **Secret** | A password-like value, such as a key to a service. Never put one in the code or share it. |
| **Webhook** | A message another company's server sends ours when something happens, such as "this payment went through". |
| **Cron job, daily job** | A task the server runs on a schedule. Hoshikopi's runs once a day. |
| **Test Mode** | A payment company's practice mode. Payments look real but no money moves. Hoshikopi only ever runs in Test Mode. |

### Checking it works

| Word | What it means here |
| --- | --- |
| **Test** | A small program that checks the site does what it should, and fails loudly if it does not. |
| **Unit test, database test** | A test of one rule in the code, such as how a price is worked out, run with **Vitest**. |
| **Browser test (e2e)** | A test that opens the site in a real browser and clicks through it like a person, run with **Playwright**. "e2e" means end to end. |
| **CI** | Continuous integration: the checks GitHub runs on every pull request, all of which must pass before it is merged. |
| **Lint** | An automatic check for common mistakes and style slips in the code. |
| **Accessibility (a11y)** | Making the site usable for everyone, including people who use a keyboard only or a screen reader. Checked with **axe**. |
| **Lighthouse** | Google's tool that scores how fast and accessible a page is. |
| **Audit** | A top-to-bottom review of the whole project for bugs and risks. Findings are ranked **P0** (fix now) to **P3** (polish). |

### Project words

| Word | What it means here |
| --- | --- |
| **MVP, V1** | The first complete version of the site (minimum viable product), then the second, with extra features. |
| **Phase, batch** | The roadmap splits the work into phases, and each phase into batches. One batch is one pull request. |
| **ADR** | Architecture decision record: a one-page note of one decision and why it was made. |
| **PRD** | Product requirements document: what the site must do. Each requirement has an ID, such as ORD-03. |

## 5. Where to go next

Back to [section 1](#1-pick-your-path) and follow your path. If a word is still unclear, check the [Glossary](../GLOSSARY.md); if it is not there either, it is worth adding.
