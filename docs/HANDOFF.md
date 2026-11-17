# Taking over Hoshikopi

> **In plain words:** Hoshikopi is a finished portfolio website for an invented cafe in Metro Manila. This page is where a new owner or project manager starts: what the site is, what it runs on, who holds the keys, what to check now and then, what to do when something breaks, and what is left to do. No real money ever moves through it, and every invented detail is labelled.
>
> **Who should read it:** a new owner or project manager, first. A developer reads it before [docs/06-SETUP.md](06-SETUP.md).
> **Last checked:** 2026-11-17.

## Contents

1. [What Hoshikopi is](#1-what-hoshikopi-is)
2. [What is real and what is invented](#2-what-is-real-and-what-is-invented)
3. [Who uses it](#3-who-uses-it)
4. [The live site and the services it runs on](#4-the-live-site-and-the-services-it-runs-on)
5. [Secrets and access](#5-secrets-and-access)
6. [Routine care](#6-routine-care)
7. [How a change goes live](#7-how-a-change-goes-live)
8. [When something goes wrong](#8-when-something-goes-wrong)
9. [What is left to do](#9-what-is-left-to-do)
10. [Where to find things](#10-where-to-find-things)
11. [For the next developer](#11-for-the-next-developer)

## 1. What Hoshikopi is

Hoshikopi is a concept cafe in Metro Manila and the website that runs it. The site does two jobs:

- **It sells the place:** the menu, the Opening Hours, the room, Events and Posts (news articles).
- **It runs the counter:** Customers order ahead for pickup, pay, and collect Stars toward a free drink. Baristas work through Orders on the Bar Screen (a page on a tablet behind the counter). The Manager runs everything else from `/manage`.

| | |
| --- | --- |
| Live site | https://hoshikopi.vercel.app |
| Code | https://github.com/xtiannjose/Hoshikopi |
| State on 2026-11-17 | Phases 0 to 10 of the [roadmap](07-ROADMAP.md) are done: every planned feature, a full audit and all its fixes except polish. Phase 11 is in progress: these handoff docs (11.1), then five small fix batches (11.2 to 11.6). New features are on hold. |

The site uses fixed words for its parts, such as Menu Item, Pickup Time, Order Code and Star. Each one is defined in the [Glossary](../GLOSSARY.md), and this page capitalises them the same way.

## 2. What is real and what is invented

Hoshikopi is a portfolio project, not a real business. Two rules hold everywhere ([ADR 0006](adr/0006-concept-project-no-real-money.md); an ADR, "architecture decision record", is a one-page note of a decision and why it was made):

1. **Invented details are labelled.** The Concept Notice sits in every page footer and at checkout: "Hoshikopi is a concept cafe. Orders and payments here are for demonstration."
2. **No real money moves.** Online payments run only in Test Mode.

| Part | Real or invented |
| --- | --- |
| The website, its code and its tests | Real. Ordering, payment, Stars and the Bar Screen work end to end. |
| The name Hoshikopi | Real for the project |
| The cafe's address, map pin, people, menu prices and photos | Invented, or plain stand-in panels until Concept images are made ([docs/ASSETS.md](ASSETS.md)) |
| Payments | Test Mode only. The live site uses the `fake` payment provider. |
| Emails | The live site sends none yet (see Resend in [section 4](#4-the-live-site-and-the-services-it-runs-on)) |
| Search engines | Kept away on purpose (`noindex`), because the address is invented |

**How payments work without money.** The site talks to payment companies through one connector with two versions:

- **`fake`** is built into the site. It shows a Test Mode checkout page, then sends the site a signed webhook (a message saying "this payment went through"), exactly as a real company would. It refuses to run on any address except `localhost` and `*.vercel.app` ([ADR 0003](adr/0003-payments-paymongo-test-mode.md)).
- **`paymongo`** connects to PayMongo, a Philippine payment company (GCash, Maya, card). It is written and tested, but it has never met PayMongo's test system: PayMongo paused new sign-ups in November 2026. It refuses live keys (`sk_live_`) and accepts only test keys (`sk_test_`).

**Demo Mode** is on whenever `fake` runs. Nobody stands behind the bar of a concept cafe, so a visitor can tap "Be the barista" on their own Order page and watch it move to Picked Up ([ADR 0015](adr/0015-demo-mode-visitor-plays-the-barista.md)). The live site also takes Orders all day, so the demo works from any time zone. The Visit page still shows the cafe's real Opening Hours.

Changing either rule (dropping the Concept Notice, or taking real money) needs a new ADR.

## 3. Who uses it

| Who | What they are | What they can do | Where |
| --- | --- | --- | --- |
| **Guest** | A Customer without an account | Browse the menu, choose Options, order ahead, pay online (Test Mode) or Pay at Pickup, follow the Order live, cancel it before the bar accepts it | Public pages, `/cart`, `/checkout`, `/orders/...` |
| **Member** | A Customer with an account (email link or Google) | Everything a Guest can, plus: earn 1 Star per drink, swap 9 Stars for a free drink (a Reward), save Favourites, Order again, see past Orders, download or delete their data | `/account`, `/account/stars` |
| **Barista** | Staff who work the bar | Move Orders on the Bar Screen (accept, start, mark Ready, hand over) and mark Menu Items and Options Sold Out | `/bar`, `/manage` (Today), `/manage/menu` (Sold Out only) |
| **Manager** | Staff with every power | Everything a Barista can, plus: the menu and prices, Opening Hours, Special Hours, Capacity, Prep Time, pausing ordering, Busy Mode, the cafe's details, Events, Posts, Inquiries, Refunds, Star adjustments, Reports, and giving or taking Staff roles | All of `/manage`, and the Manager controls on `/bar` |

**How Staff sign in.** Staff sign in like Members, then type a 6-digit code from an authenticator app (the Second Factor) before using `/manage`. They type it again after 12 hours. A Barista's taps on the Bar Screen never ask for it.

**How someone becomes Staff.** The person signs in once. A Manager then gives them a role by email at `/manage/staff`. A Manager cannot change their own role, so at least one Manager always stays. One known gap: the only Manager can still delete their own account on `/account`, which locks everyone out of `/manage` (DC-01, fixed in batch 11.2). Until then, never delete a Manager's account.

How Baristas and the Manager use each screen, step by step, is in [docs/STAFF-GUIDE.md](STAFF-GUIDE.md).

## 4. The live site and the services it runs on

The site lives at https://hoshikopi.vercel.app. It has no domain of its own yet.

| Service | What it does for Hoshikopi | Plan and state | Limits to know |
| --- | --- | --- | --- |
| **GitHub** | Holds the code and its whole history. Runs the CI checks (automatic tests) on every pull request. Dependabot opens update pull requests weekly. | Repository `xtiannjose/Hoshikopi`, public. **It is the project's only copy.** | Public: anyone can read it, so a secret must never go in it |
| **Vercel** | Hosts the site, builds every change, runs the daily job | Hobby plan (free). Server code runs in Singapore (`sin1`), next to the database. | Keeps logs for **1 hour** only. Sends **no alerts**. The daily job runs once a day. |
| **Vercel Blob** | Stores photos uploaded in `/manage` | Store `hoshikopi-photos` (public), created 2026-11-07, part of the Vercel project | No photo has been uploaded on the live site yet ([section 9](#9-what-is-left-to-do)) |
| **Neon** | The database (PostgreSQL), where every Order, Star, Menu Item and account lives | Free plan, Singapore (`ap-southeast-1`), connected through the Vercel project's **Storage** tab | A **monthly compute allowance**: once used, Neon stops the database until the next month and every page that reads data fails. **6 hours** of history for restoring. |
| **Google Cloud** | "Continue with Google" sign-in | An OAuth client (Google's sign-in key) in a Google Cloud project "Hoshikopi", live since 2026-11-07, Production only | Preview deployments cannot use it, because their addresses change |
| **Resend** | Sending email (sign-in links, Order emails) | **Not set up.** It waits until the project has a domain. | Without it the live site sends no email. Visitors sign in with Google. |
| **PayMongo** | Real Test Mode checkout for GCash, Maya and card | **Not set up.** PayMongo paused new sign-ups; the live site uses `fake`. | The steps to switch it on are in roadmap batch 3.4 |

Vercel Hobby and Neon Free are free plans. Nothing in the code or configuration uses a paid service.

**The daily job.** Vercel calls `/api/cron/daily` at 22:00 UTC ([vercel.json](../vercel.json)). On the Hobby plan it fires some time between 6:00 and 6:59 AM Manila time, before opening. It:

1. expires unpaid online Orders and cancels earlier days' Pay at Pickup Orders nobody collected;
2. deletes sign-in and checkout limit records older than a day, and Guest Carts untouched for 30 days;
3. on the demo, moves the seeded demo Events, Promo and Seasonal drink forward once they lapse, so nobody has to re-date them;
4. refreshes the menu, so yesterday's Sold Out marks clear.

It only runs when Vercel sends the right `CRON_SECRET`; anyone else gets "Not allowed".

## 5. Secrets and access

A secret is a value that works like a password. Secrets live in two places only, and never in git:

| Place | What is there |
| --- | --- |
| The Vercel project: **Settings**, **Environment Variables** | The live site's values |
| A developer's computer: `.env.local` and `.env.test` | Their own local values. Git ignores these files. |
| Git | Only [.env.example](../.env.example): every name, with empty values |

After changing any variable in Vercel, redeploy (Vercel **Deployments**, the latest Production deployment, **Redeploy**), because a running site keeps the values it started with.

| Variable | What it is | Before you change it |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | The server secret behind sign-in, Order links, Event Sign-up links and the Staff Second Factor | Change it only if it leaked. Everyone is signed out, Order and Sign-up links already sent stop working, and every Staff member must set up their authenticator again (delete their row in `two_factors`, as in [docs/06-SETUP.md](06-SETUP.md) section 6). |
| `CRON_SECRET` | Lets Vercel call the daily job | Safe to change. Redeploy afterwards. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | The Google sign-in key, from Google Cloud; Production only, marked Sensitive | Change both together, from the same Google OAuth client |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | The database addresses, with its password inside. Set by the Neon connection, nothing to copy. | Leave them to the Neon connection |
| `BLOB_STORE_ID` | Which photo store to use. Set by Vercel; the store signs in by itself, so there is no key. | Leave it to Vercel |
| `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL`, `PAYMENT_PROVIDER` | Settings, not secrets: the site's address and `fake` | Keep `PAYMENT_PROVIDER` at `fake` until PayMongo is set up |
| `RESEND_API_KEY`, `MAIL_FROM`, `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET` | Not set on the live site yet | Set them when Resend or PayMongo is set up ([docs/06-SETUP.md](06-SETUP.md) section 9) |

The full list, with local examples, is [docs/06-SETUP.md](06-SETUP.md) section 5. A new developer makes their own `.env.local` from `.env.example` and never copies the live values.

### Handing access to a new person

Do these in order. Each service needs the new person's own account.

1. **GitHub.** On the repository, open **Settings**, **Collaborators**, **Add people**, and enter their GitHub username. They get an invitation by email; once they accept, they can push branches and open pull requests. To hand over the project for good, use **Settings**, **General**, **Transfer ownership** instead, then check the Vercel project's **Settings**, **Git** still points at the repository.
2. **Vercel.** The Hobby plan has one member, so a second person cannot be invited to it. Either move the project to an account or team the new owner controls (**Settings**, **General**, **Transfer Project**), or move to a paid plan that allows team members. After a move, open **Storage** and **Settings**, **Environment Variables** and check the Neon database, the Blob store and every variable came with it.
3. **Neon.** The database was connected through the Vercel project's **Storage** tab, so it is reached from the Vercel project: open **Storage** and choose the Neon database to get to the Neon console (usage, SQL editor, branches, restore).
4. **Google Cloud.** In the Google Cloud console, project "Hoshikopi", open **IAM & Admin**, **IAM**, **Grant access**, add the new person's Google account and give it the Owner role. Then, in **Google Auth Platform**, **Branding**, change the support email to theirs. The OAuth client itself stays the same, so nothing changes in Vercel.
5. **On the site.** The new person signs in with Google on https://hoshikopi.vercel.app. The current Manager gives them the Manager role at `/manage/staff`. They set up their authenticator on their first `/manage` visit. Then the new Manager takes the old Manager's role away (nobody can change their own).

## 6. Routine care

| When | What to check | Where | Why |
| --- | --- | --- | --- |
| After every service | Close the Bar Screen tab | The tablet | An open Bar Screen asks the database for news every 3 seconds. That keeps Neon awake and spends its monthly compute allowance. |
| Every day the site is used | Look for a **Needs a refund** box at the top of the page | `/manage/orders` | It lists money still held for an Order that is over: paid after it closed, or a refund that did not go through. The Manager refunds each one ([section 8](#8-when-something-goes-wrong)). |
| Every day the site is used | New Inquiries and Event Sign-ups | `/manage/inquiries`, each Event in `/manage/events` | The live site sends no email, so these show only in `/manage` |
| Weekly | Compute used this month | Neon console, the project's usage page | To see the allowance running out before the database stops |
| Weekly | The latest Production deployment says **Ready** | Vercel project, **Deployments** | A failed build keeps the old version live, so it is easy to miss |
| Weekly | Dependabot pull requests (library updates, grouped by week) | GitHub, **Pull requests** | Merge each one once its checks are green, like any other change |
| Monthly | Run the two-minute demo on the live site | [docs/DEMO-SCRIPT.md](DEMO-SCRIPT.md) | It walks every main flow, so anything broken shows up |

Vercel keeps logs for one hour, so look at a problem while it is happening. Server errors are one line each in the Vercel project's **Logs**; search for `"level":"error"`.

## 7. How a change goes live

Every change, however small, takes the same path. A pull request is a request to merge one branch of work into `main`, the version the live site runs.

1. **A developer makes a branch** from `main`, one per batch (for example `feature/11.2-safety-first`), and does the work there.
2. **They run the checks on their computer:** `npm run qa`, and `npm run qa:full` for anything visible (see [section 11](#11-for-the-next-developer)).
3. **They push the branch and open a pull request** on GitHub. (When Claude Code does the work, it commits, pushes and opens pull requests only when the owner asks.)
4. **CI runs by itself.** GitHub Actions checks the code style, formatting and types, runs the unit and database tests against a throwaway database, and looks for known security holes in the libraries. When it passes, the pull request shows a green tick. It does not build the site or run the browser tests yet (DC-02, batch 11.2).
5. **Vercel builds a Preview deployment** with its own web address. Use it only to see that the build works. **Previews share the production database:** an Order placed on a preview is a real row in the live data. A pull request whose code needs a new database column fails its Preview check until it is merged; that is expected.
6. **If the change includes a migration** (a script in `prisma/migrations` that changes the database's shape), make a snapshot first: in the Neon console, create a branch from the production branch. Delete it a few days later.
7. **The owner merges it on GitHub** with **Create a merge commit**, once CI is green.
8. **Vercel builds Production.** It runs the migrations first (`prisma migrate deploy`), then builds the site (`next build`). When the deployment says **Ready**, https://hoshikopi.vercel.app runs the new version.
9. **If the build fails**, the previous version keeps running. A migration that already ran stays in the database.

Because migrations run before the new code is live, the old code must keep working with the new database shape. So a migration first only adds (a new column that may be empty or has a default). Removing or renaming waits for a later release, once no code reads the old name ([docs/06-SETUP.md](06-SETUP.md) section 9).

## 8. When something goes wrong

| What you see | Likely cause | What to do |
| --- | --- | --- |
| The site does not load at all | The latest deployment broke, or Vercel itself has trouble | Open Vercel **Deployments**: is the latest Production deployment **Ready**? Search **Logs** for `"level":"error"` (the last hour only). If a recent merge caused it, roll back (the "bad deploy" row below). |
| The menu, checkout and `/manage` show error pages, often late in the month | Neon's monthly compute allowance is used up, so Neon stopped the database until next month | Check usage in the Neon console. Wait for the new month, or move Neon to a paid plan. To prevent it, close Bar Screens after service. |
| A sign-in email never arrives on the live site | No email service yet: the live site sends no email to real addresses | Use **Continue with Google**. For the seeded demo accounts, the link is in Vercel **Logs** under `[email] demo account <email>`, for one hour ([docs/06-SETUP.md](06-SETUP.md) section 9, step 5). The lasting fix is a domain, then Resend. |
| **Continue with Google** is missing or fails | On a Preview, this is expected: Google is set up for Production only. On Production, `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is missing, or the OAuth client's addresses changed. | Check both variables in Vercel, then the client in **Google Auth Platform**, **Clients**: the redirect address must be `https://hoshikopi.vercel.app/api/auth/callback/google`. Redeploy after any change. |
| The daily job did not run: yesterday's Pay at Pickup Orders are still open, or a demo Event that has ended still shows as the latest | `CRON_SECRET` is missing, or was changed without a redeploy (the job answers "Not allowed"); or the database was stopped. Before 7 AM Manila, it may simply not have fired yet. | In Vercel, open **Settings**, **Cron Jobs** to see the job and run it by hand. Check `CRON_SECRET` is set for Production, then redeploy. A missed day does little harm: unpaid online Orders also expire whenever their pages load, and the next run catches up. |
| An Order stays under **Needs a refund** on `/manage/orders` | It was paid after it had closed (Expired or Cancelled), or its automatic Refund failed | A Manager opens its day (the link on its Order Code) and presses **Refund**. Pressing again finishes a refund that stopped half way. On the live site this is `fake` money. If it still stays, look in **Logs** within the hour; one rare case is known (DC-05, fixed in batch 11.2). |
| A change went live and broke something | A bad merge | In Vercel **Deployments**, open the menu of the last good Production deployment and choose **Instant Rollback**. A rollback changes the code only; the database keeps every migration. **Never roll back past a deployment whose migration removed or renamed something:** fix forward with a new pull request instead. |
| Data was deleted or changed by mistake | A wrong edit, or a bad migration | Neon's point-in-time restore, in the Neon console, brings the database back to any moment in the last 6 hours. After 6 hours, fix it forward by hand. |
| Nobody can open `/manage` | The only Manager deleted their account (DC-01), or no Manager was ever set | In the Neon SQL editor: `UPDATE users SET role = 'manager' WHERE email = '<their email>';` ([docs/06-SETUP.md](06-SETUP.md) section 9, step 5) |
| A Staff member lost the phone with their authenticator | | Delete their Second Factor row (the command in [docs/06-SETUP.md](06-SETUP.md) section 6, run in the Neon SQL editor on the live site). They set up again on their next `/manage` visit. |
| Checkout says "We're not taking orders right now" | A Manager paused ordering | A Manager resumes it on `/manage/hours` or the Bar Screen |

The two-minute demo has its own list of fixes in [docs/DEMO-SCRIPT.md](DEMO-SCRIPT.md), "If something goes wrong".

## 9. What is left to do

### 9.1 Steps only the owner can take

1. **The first live photo upload** (roadmap batch 5.4). Sign in as a Manager on the live site and upload a photo to one Menu Item in `/manage/menu`, then check it shows on the menu. This proves the Blob store `hoshikopi-photos` works. Real photos are on hold (owner, 2026-11-07).
2. **The seeded dates on the live site** (audit item ops:8, the one open P1). Since batch 10.18 the daily job moves the demo Events, Promo and Seasonal drink forward by itself. Check on the live site that an upcoming Event with Seats shows, then mark the item done.
3. **Rehearse the demo.** Say the [two-minute demo](DEMO-SCRIPT.md) out loud on the live site and time it. Every step has a passing test; the spoken run is the last check.
4. **Read the case study's "How I worked"** section ([docs/CASE-STUDY.md](CASE-STUDY.md)). It speaks in the owner's voice, so the owner confirms it is true.
5. **Two GitHub settings** ([docs/audit/2026-11-17.md](audit/2026-11-17.md) section 5):
   - Turn on Dependabot alerts: repository **Settings**, **Code security**. GitHub then warns when a library the site uses gets a known security hole. They are off now.
   - Require the CI check before merging: repository **Settings**, **Branches**, a rule for `main`. A pull request with failing checks then cannot be merged by accident.

### 9.2 Phase 11 fix batches

The 2026-11-17 deep check found no serious problem and 46 smaller ones (0 P0, 2 P1, 29 P2, 15 P3). They are grouped into five batches, in order of risk. Each is one branch and one pull request, and the owner approves each before it starts. Every item, with what goes wrong and the fix, is in [docs/audit/2026-11-17.md](audit/2026-11-17.md).

| Batch | Items | In one line |
| --- | --- | --- |
| 11.2 Safety first | DC-01 to DC-07 | The last Manager can't delete their account, CI builds the site, local commands can't reach the live database, tests can't send real email, Refund and Star edge cases, paid Orders the bar never accepted; also `better-auth` 1.7.25 |
| 11.3 Abuse limits and inputs | DC-08 to DC-11 | A daily Pay at Pickup limit for Members, sign-in links a stranger can't use up, two inputs that crash a page, tests for every limit |
| 11.4 Staff tools | DC-12 to DC-23 | The Bar Screen's pause after 12 hours and its Sold Out panel, hours and Seats warnings, photo errors, Barista Picks, Category and Event addresses, keyboard and screen reader fixes in `/manage` and `/bar` |
| 11.5 Customer pages | DC-24 to DC-37 | Old Event pages, Home's jump while loading and its hours line, a build fallback for the menu, fewer account reads, the demo's late-night gap, eight small copy and form fixes |
| 11.6 Tests | DC-38 to DC-46 | Missing tests: Staff-cancel refunds, the Sold Out reset, browser-test collisions and time limits, accessibility in both palettes, the daily job, the Staff role test |

### 9.3 Polish nobody has planned

The November audit leaves **43 P3 items**: observations, nits and ideas, with no action planned. They are listed under "P3 (43)" in [docs/audit/2026-11-13.md](audit/2026-11-13.md). Pick one up when a batch already touches that part of the code.

### 9.4 After V1, and becoming real

Not scheduled ([roadmap](07-ROADMAP.md) section 13): an installable app with push notifications, ordering for tomorrow, more than one cafe, delivery, gift cards, loyalty tiers and table QR ordering. A real cafe would also need a business registration, BIR receipts, the Internet Transactions Act duties, live payment keys, the senior citizen and PWD discount, a paid database plan with longer backups, real photos and real staff ([PRD](01-PRD.md) section 9, "Becoming real").

## 10. Where to find things

| Document | What it holds | Who it is for | Read it when |
| --- | --- | --- | --- |
| [README.md](../README.md) | The front door: what Hoshikopi is, screenshots, links | Everyone | First |
| This page | Taking over: services, access, care, troubleshooting, what is left | Owner, project manager | Taking over, or something broke |
| [docs/STAFF-GUIDE.md](STAFF-GUIDE.md) | How Baristas and the Manager use the Bar Screen and `/manage` | Staff, owner | Training someone, or running the cafe on the site |
| [GLOSSARY.md](../GLOSSARY.md) | Every product word and what it means | Everyone | A word is unclear |
| [docs/DEMO-SCRIPT.md](DEMO-SCRIPT.md) | The two-minute demo: what to do and say | Owner, anyone showing it | Before showing the site to someone |
| [docs/CASE-STUDY.md](CASE-STUDY.md) | The problem, what was built, the decisions, the quality work | Reviewers, recruiters | Explaining the project |
| [docs/METRICS.md](METRICS.md) | The success targets, measured | Reviewers | Checking the numbers |
| [docs/01-PRD.md](01-PRD.md) | Goals, people, scope, every requirement with an ID (such as ORD-03) | Owner, developer | Deciding if something is in or out |
| [docs/02-RESEARCH-CAFES.md](02-RESEARCH-CAFES.md) | What other cafe sites and ordering apps do | Owner, designer | Thinking about a new feature |
| [docs/03-ARCHITECTURE.md](03-ARCHITECTURE.md) | How the code is organised: modules, pages, Order Status, payments, Stars, live updates, security | Developer | Changing code |
| [docs/04-DATA-MODEL.md](04-DATA-MODEL.md) | Every database table and its rules, and the seed data | Developer | Changing the database |
| [docs/05-DESIGN-SYSTEM.md](05-DESIGN-SYSTEM.md) | The look: colours, type, components, motion, accessibility | Designer, developer | Any change people can see |
| [docs/06-SETUP.md](06-SETUP.md) | Running it on a computer, every setting, the live deploy, backups | Developer, owner | Setting up, or touching the live services |
| [docs/07-ROADMAP.md](07-ROADMAP.md) | Every phase and batch, what is done and what is next | Owner, developer | Choosing the next piece of work |
| [docs/08-TOOLING.md](08-TOOLING.md) | Which tool or Claude Code skill fits which job, ports, machine facts | Developer | Choosing how to work |
| [docs/ASSETS.md](ASSETS.md) | Every non-code file, its source and licence; the Concept images still to make | Designer, developer | Adding a font or picture |
| [docs/adr/README.md](adr/README.md) | Every decision in one sentence, linking the 15 ADRs | Everyone | Before changing how something works |
| [docs/audit/README.md](audit/README.md) | The two audits: what they found, what is fixed, what is open | Owner, developer | Planning fixes |
| [docs/audit/2026-11-17.md](audit/2026-11-17.md) | The 2026-11-17 deep check, in plain words | Owner, developer | Working on Phase 11 |
| [CLAUDE.md](../CLAUDE.md) | The rules every working session follows | Developer, coding agent | Before any code change |
| [vercel.json](../vercel.json), [.env.example](../.env.example) | The live build command and daily job; every setting's name | Developer | Changing the deploy or a setting |

## 11. For the next developer

Read in this order:

1. [docs/06-SETUP.md](06-SETUP.md): get it running. You need Node.js 22.12 or newer, npm, Git and Docker Desktop. The local database runs in Docker on port 5434. Every outside account is optional: each has a local stand-in, so the whole site runs with no sign-ups.
2. [CLAUDE.md](../CLAUDE.md): the rules the code cannot tell you. For example, money is whole centavos (PHP 165.00 is `16500`), so it never rounds wrong; the server prices everything; Order Status changes only through `transition()`; payment state comes only from verified webhooks.
3. [docs/03-ARCHITECTURE.md](03-ARCHITECTURE.md): how the modules fit together.
4. [docs/07-ROADMAP.md](07-ROADMAP.md) section 0 and Phase 11: what to work on next.

**The checks:**

| Command | What it runs | When |
| --- | --- | --- |
| `npm run qa` | Lint, Prettier check, type check, the Vitest unit and database tests, a production build, and `npm audit` | Before every pull request |
| `npm run qa:full` | `qa`, then the Playwright browser tests at phone and desktop width, with accessibility checks (they use port 3100 and the `hoshikopi_e2e` database) | Before any pull request that changes what people see |

Both need the Docker database and a `.env.test` file ([docs/06-SETUP.md](06-SETUP.md) section 3). Finish the browser tests well before midnight Manila time: the day changing during a run breaks them (about 11:20 PM is the limit).

Two warnings until batch 11.2 lands:

- **Never point a local database command at the live database.** `vercel env pull` writes the live `DATABASE_URL_UNPOOLED` into `.env.local`, and `npm run db:reset` would then wipe production after one prompt (DC-03).
- **Keep real keys out of `.env.local` while testing.** The database tests also read it, so a real `RESEND_API_KEY` there sends real emails (DC-04).

Stop every server you start; the ports are in [docs/08-TOOLING.md](08-TOOLING.md) section 3.
