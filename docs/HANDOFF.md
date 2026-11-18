# Taking over Hoshikopi

> **In plain words:** Hoshikopi is a finished portfolio website for a concept cafe. This page is where a new owner or project manager starts. It covers what the site is, the services it runs on, who holds the keys, what to check now and then, what to do when something breaks, and what is left. No real money ever moves through it, and every invented detail is labelled.
>
> **Who should read it:** a new owner or project manager, first. A developer reads it before [docs/06-SETUP.md](06-SETUP.md).
> **Last checked:** 2026-11-18.

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

Hoshikopi is a concept cafe and the website that runs it. The site does two jobs:

- **It sells the place:** the menu, the Opening Hours, the room, Events and Posts (news articles).
- **It runs the counter:** Customers order ahead for pickup, pay, and collect Stars toward a free drink. Baristas work through Orders on the Bar Screen (a page on a tablet behind the counter). The Manager runs everything else from `/manage`.

| | |
| --- | --- |
| Live site | https://hoshikopi.vercel.app |
| Code | https://github.com/xtiannjose/Hoshikopi |
| State on 2026-11-18 | Everything planned is built and live: Phases 0 to 12 of the [roadmap](07-ROADMAP.md). New features are on hold. |

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

**Demo Mode** is on whenever `fake` runs. Nobody stands behind the bar of a concept cafe. So a visitor can tap "Be the barista" on their own Order page and watch it move to Picked Up ([ADR 0015](adr/0015-demo-mode-visitor-plays-the-barista.md)). The live site also takes Orders all day, so the demo works from any time zone. The Visit page still shows the cafe's real Opening Hours.

Changing either rule (dropping the Concept Notice, or taking real money) needs a new ADR.

## 3. Who uses it

| Who | What they are | What they can do | Where |
| --- | --- | --- | --- |
| **Guest** | A Customer without an account | Browse the menu, choose Options, order ahead, pay online (Test Mode) or Pay at Pickup, follow the Order live, cancel it before the bar accepts it | Public pages, `/cart`, `/checkout`, `/orders/...` |
| **Member** | A Customer with an account (email link or Google) | Everything a Guest can, plus: earn 1 Star per drink, swap 9 Stars for a free drink (a Reward), save Favourites, Order again, see past Orders, download or delete their data | `/account`, `/account/stars` |
| **Barista** | Staff who work the bar | Move Orders on the Bar Screen (accept, start, mark Ready, hand over) and mark Menu Items and Options Sold Out | `/bar`, `/manage` (Today), `/manage/menu` (Sold Out only) |
| **Manager** | Staff with every power | Everything a Barista can, plus: the menu and prices, Opening Hours, Special Hours, Capacity, Prep Time, pausing ordering, Busy Mode, the cafe's details, Events, Posts, Inquiries, Refunds, Star adjustments, Reports, and giving or taking Staff roles | All of `/manage`, and the Manager controls on `/bar` |

**How Staff sign in.** Staff sign in like Members, then type a 6-digit code from an authenticator app (the Second Factor) before using `/manage`. They type it again after 12 hours. A Barista's taps on the Bar Screen never ask for it.

**How someone becomes Staff.** The person signs in once. A Manager then gives them a role by email at `/manage/staff`. A Manager cannot change their own role, so at least one Manager always stays. A Staff account cannot be deleted from `/account` either: another Manager removes the Staff role first (DC-01, fixed in batch 11.2).

How Baristas and the Manager use each screen, step by step, is in [docs/STAFF-GUIDE.md](STAFF-GUIDE.md).

## 4. The live site and the services it runs on

The site lives at https://hoshikopi.vercel.app. It has no domain of its own yet.

| Service | What it does for Hoshikopi | Plan and state | Limits to know |
| --- | --- | --- | --- |
| **GitHub** | Holds the code and its whole history. Runs the CI checks (automatic tests) on every pull request. Dependabot opens update pull requests weekly. | Repository `xtiannjose/Hoshikopi`, public. **It is the project's only copy.** | Public: anyone can read it, so a secret must never go in it |
| **Vercel** | Hosts the site, builds every change, runs the daily job | Hobby plan (free). Server code runs in Singapore (`sin1`), next to the database. | Keeps logs for **1 hour** only. Sends **no alerts**. The daily job runs once a day. |
| **Vercel Blob** | Stores photos uploaded in `/manage` | Store `hoshikopi-photos` (public), created 2026-11-07, part of the Vercel project | 19 menu photos uploaded on the live site (2026-11-18). Previews share it with the live site. |
| **Neon** | The database (PostgreSQL), where every Order, Star, Menu Item and account lives | Free plan, Singapore (`ap-southeast-1`), connected through the Vercel project's **Storage** tab | A **monthly compute allowance**: once used, Neon stops the database until the next month and every page that reads data fails. **6 hours** of history for restoring. |
| **Google Cloud** | "Continue with Google" sign-in | An OAuth client (Google's sign-in key) in a Google Cloud project "Hoshikopi", live since 2026-11-07, Production only | Preview deployments cannot use it, because their addresses change |
| **Resend** | Sending email (sign-in links, Order emails) | **Not set up.** It waits until the project has a domain. | Without it the live site sends no email. Visitors sign in with Google. |
| **PayMongo** | Real Test Mode checkout for GCash, Maya and card | **Not set up.** PayMongo paused new sign-ups; the live site uses `fake`. | The steps to switch it on are in roadmap batch 3.4 |

Vercel Hobby and Neon Free are free plans. Nothing in the code or configuration uses a paid service.

**The daily job.** Vercel calls `/api/cron/daily` at 22:00 UTC ([vercel.json](../vercel.json)). On the Hobby plan it fires some time between 6:00 and 6:59 AM Manila time, before opening. It:

1. expires unpaid online Orders, cancels earlier days' Pay at Pickup Orders nobody collected, and cancels and refunds earlier days' paid Orders the bar never accepted;
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
3. **Neon.** The database is reached from the Vercel project, because it was connected there. Open **Storage** and choose the Neon database. That opens the Neon console, with usage, the SQL editor, branches and restore.
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
4. **CI runs by itself.** GitHub Actions checks the code style, formatting and types. It runs the unit and database tests against a throwaway database, builds the whole site, and looks for known security holes in the libraries. When it passes, the pull request shows a green tick, and only then can it be merged. The browser tests still run only on a developer's computer.
5. **Vercel builds a Preview deployment** with its own web address. Use it only to see that the build works. **Previews share the production database:** an Order placed on a preview is a real row in the live data. A pull request whose code needs a new database column fails its Preview check until it is merged; that is expected.
6. **If the change includes a migration** (a script in `prisma/migrations` that changes the database's shape), make a snapshot first. In the Neon console, create a branch from the production branch. Delete it a few days later.
7. **The owner merges it on GitHub** with **Create a merge commit**, once CI is green.
8. **Vercel builds Production.** It runs the migrations first (`prisma migrate deploy`), then builds the site (`next build`). When the deployment says **Ready**, https://hoshikopi.vercel.app runs the new version.
9. **If the build fails**, the previous version keeps running. A migration that already ran stays in the database.

Because migrations run before the new code is live, the old code must keep working with the new database shape. So a migration first only adds (a new column that may be empty or has a default). Removing or renaming waits for a later release, once no code reads the old name ([docs/06-SETUP.md](06-SETUP.md) section 9).

## 8. When something goes wrong

Find what you see, then follow its steps. Vercel keeps logs for one hour only, so look while the problem is happening. To find server errors, open the Vercel project's **Logs** and search for `"level":"error"`.

### The site does not load at all

**Likely cause:** the latest deployment broke, or Vercel itself has trouble.

1. Open Vercel **Deployments**. Is the latest Production deployment **Ready**?
2. Search **Logs** for `"level":"error"`.
3. If a recent merge caused it, roll back (see [A change went live and broke something](#a-change-went-live-and-broke-something)).

### The menu, checkout and `/manage` show error pages, often late in the month

**Likely cause:** Neon's monthly compute allowance is used up, so Neon stopped the database until next month.

1. Check usage in the Neon console.
2. Wait for the new month, or move Neon to a paid plan.
3. To prevent it, close Bar Screens after service.

### A sign-in email never arrives on the live site

**Likely cause:** there is no email service yet, so the live site sends no email to real addresses.

1. Use **Continue with Google** instead.
2. For the seeded demo accounts, the link is in Vercel **Logs** under `[email] demo account <email>`, for one hour ([docs/06-SETUP.md](06-SETUP.md) section 9, step 5).
3. The lasting fix is a domain, then Resend.

### Continue with Google is missing or fails

**Likely cause:** on a Preview, this is expected: Google is set up for Production only. On Production, `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is missing, or the Google sign-in key's addresses changed.

1. Check both variables in Vercel.
2. In Google Cloud, open **Google Auth Platform**, **Clients**. The redirect address must be `https://hoshikopi.vercel.app/api/auth/callback/google`.
3. Redeploy after any change.

### The daily job did not run

You see yesterday's Pay at Pickup Orders still open, or an Event that has ended still shown as the latest.

**Likely cause:** `CRON_SECRET` is missing, or it was changed without a redeploy (the job answers "Not allowed"). Or the database was stopped. Before 7 AM Manila time, it may simply not have run yet.

1. In Vercel, open **Settings**, **Cron Jobs** to see the job and run it by hand.
2. Check `CRON_SECRET` is set for Production, then redeploy.

A missed day does little harm. Unpaid online Orders also expire whenever their pages load, and the next run catches up.

### An Order stays under Needs a refund on `/manage/orders`

**Likely cause:** it was paid after it had closed (Expired or Cancelled), or its automatic Refund failed.

1. A Manager opens its day (the link on its Order Code) and presses **Refund**.
2. If a refund stopped half way, pressing again finishes it.
3. If it still stays, look in **Logs** within the hour.

On the live site this is `fake` money.

### A change went live and broke something

**Likely cause:** a bad merge.

1. In Vercel **Deployments**, open the menu of the last good Production deployment.
2. Choose **Instant Rollback**.

A rollback changes the code only; the database keeps every migration. **Never roll back past a deployment whose migration removed or renamed something.** Fix forward with a new pull request instead.

### Data was deleted or changed by mistake

**Likely cause:** a wrong edit, or a bad migration.

1. In the Neon console, use point-in-time restore. It brings the database back to any moment in the last 6 hours.
2. After 6 hours, fix it forward by hand.

### Nobody can open `/manage`

**Likely cause:** no Manager was ever set, or the role was changed in the database by hand.

1. Open the Neon SQL editor.
2. Run `UPDATE users SET role = 'manager' WHERE email = '<their email>';` with their email ([docs/06-SETUP.md](06-SETUP.md) section 9, step 5).

### A Staff member lost the phone with their authenticator

1. In the Neon SQL editor, delete their Second Factor row (the command is in [docs/06-SETUP.md](06-SETUP.md) section 6).
2. They set it up again on their next `/manage` visit.

### Checkout says "We're not taking orders right now"

**Likely cause:** a Manager paused ordering. A Manager resumes it on `/manage/hours` or the Bar Screen.

The two-minute demo has its own fixes in [docs/DEMO-SCRIPT.md](DEMO-SCRIPT.md), "If something goes wrong".

## 9. What is left to do

### 9.1 Steps only the owner can take

1. **The seeded dates on the live site** (audit item ops:8, the one open item). The daily job moves the demo Events, Promo and Seasonal drink forward by itself. Check on the live site that an upcoming Event with Seats shows, then mark the item done.
2. **Rehearse the demo.** Say the [two-minute demo](DEMO-SCRIPT.md) out loud on the live site and time it. Every step has a passing test; the spoken run is the last check.
3. **Read the case study's "How I worked"** section ([docs/CASE-STUDY.md](CASE-STUDY.md)). It speaks in the owner's voice, so the owner confirms it is true.
4. **On the live site:**
   - upload a photo to an Event or a Post (batch 12.3) and check it shows;
   - make the Posts longer;
   - add tasting notes and drink links to the Menu Items.

Done by the owner on 2026-11-18:

- the two GitHub settings: Dependabot alerts on, and the CI check required before merging to `main`;
- Vercel's `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` for Production only, and the Singapore function region;
- a second Manager account;
- the second PC brought up to date;
- 19 menu photos uploaded on the live site (the first live upload, roadmap batch 5.4).

### 9.2 The 2026-11-17 deep check and the November polish: done

The deep check found no serious problem and 46 smaller ones (0 P0, 2 P1, 29 P2, 15 P3). The November audit had 43 small items left. Phase 11 fixed all of them, or decided them with a written reason (batches 11.2 to 11.8, 2026-11-17, pull requests #112 to #120).

- What changed for each: [docs/audit/2026-11-17.md](audit/2026-11-17.md), and the Fixed list in [docs/audit/2026-11-13.md](audit/2026-11-13.md).
- The only audit item still open is ops:8, a look at the live site's demo dates (section 9.1).

### 9.3 After V1, and becoming real

Ideas, not scheduled ([roadmap](07-ROADMAP.md) section 13):

- an installable app with push notifications;
- ordering for tomorrow;
- more than one cafe;
- delivery;
- gift cards;
- loyalty tiers;
- table QR ordering.

A real cafe would also need ([PRD](01-PRD.md) section 9, "Becoming real"):

- a business registration;
- official receipts from the tax office (BIR);
- the Internet Transactions Act duties, the rules for online sellers;
- live payment keys;
- the senior citizen and PWD discount;
- a paid database plan with longer backups;
- real photos and real staff.

## 10. Where to find things

Every document, with a reading path for each kind of reader, is in the [docs map](README.md). Two files outside `docs/` matter for the live site:

| File | What it holds | Change it when |
| --- | --- | --- |
| [vercel.json](../vercel.json) | The live build command and the daily job's time | Changing how the site deploys |
| [.env.example](../.env.example) | The name of every setting, with empty values | Adding a setting |

## 11. For the next developer

New to coding? Start with the coding words in the [docs map](README.md#4-coding-words-you-will-meet). Then read in this order:

1. [docs/06-SETUP.md](06-SETUP.md): get it running. You need Node.js 22.12 or newer, npm, Git and Docker Desktop. The local database runs in Docker on port 5434. Every outside account is optional: each has a local stand-in, so the whole site runs with no sign-ups.
2. [CLAUDE.md](../CLAUDE.md): the rules the code cannot tell you. For example:
   - money is whole centavos (PHP 165.00 is `16500`), so it never rounds wrong;
   - the server works out every price;
   - an Order's status changes only through `transition()`;
   - payment state comes only from verified webhooks.
3. [docs/03-ARCHITECTURE.md](03-ARCHITECTURE.md): how the modules fit together.
4. [docs/07-ROADMAP.md](07-ROADMAP.md), section 0: what to work on next.

**The checks:**

| Command | What it runs | When |
| --- | --- | --- |
| `npm run qa` | Lint, Prettier check, type check, the Vitest unit and database tests, a production build, and the dependency audit | Before every pull request |
| `npm run qa:full` | `qa`, then the Playwright browser tests at phone and desktop width, with accessibility checks (they use port 3100 and the `hoshikopi_e2e` database) | Before any pull request that changes what people see |

Both need the Docker database and a `.env.test` file ([docs/06-SETUP.md](06-SETUP.md) section 3). The browser tests refuse to start after 10 PM Manila time, because the demo's last order (11:15 PM) or midnight would break them mid-run. Run them in the day, or after midnight.

**Two safety guards, built in batch 11.2:**

- **Database commands on your computer reach only your own database.** `vercel env pull` writes the live database's address into `.env.local`, so `npm run db:reset` could once have wiped the live data. Now it refuses unless you ask for a remote database on purpose (`prisma/local-only.ts`).
- **The tests never send real emails or call real services**, even with a real key in `.env.local` (`tests/no-outside-services.mts`).

Stop every server you start; the ports are in [docs/08-TOOLING.md](08-TOOLING.md) section 3.

## Where to go next

- Running the cafe day to day: [docs/STAFF-GUIDE.md](STAFF-GUIDE.md).
- What to work on next: [docs/07-ROADMAP.md](07-ROADMAP.md), section 0.
- Any other document: the [docs map](README.md).
