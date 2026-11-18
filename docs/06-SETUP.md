# Setup Guide

> **In plain words:** This guide gets Hoshikopi running on a computer, step by step, and explains how the live demo is deployed. You need no outside accounts to run it locally: each outside service has a local stand-in, so the whole site works with no sign-ups. Follow the sections in order the first time; each step says what you should see when it worked.
>
> **Who should read it:** a developer setting up a new computer; whoever looks after the live demo (deploys, backups, demo sign-in); an owner checking what each account is for.
> **Last checked:** 2026-11-17.

Update this guide when a step changes. Product words follow the [Glossary](../GLOSSARY.md).

## Contents

1. [What you need](#1-what-you-need)
2. [Accounts](#2-accounts)
3. [Get the code](#3-get-the-code)
4. [Libraries](#4-libraries)
5. [Environment variables](#5-environment-variables)
6. [Database](#6-database)
7. [Everyday commands](#7-everyday-commands)
8. [GitHub](#8-github)
9. [Demo deploy](#9-demo-deploy)

## 1. What you need

Install these programs first. The "Check" column is a command that prints the version, so you can see the program is installed.

| Tool | What it is for | Version | Check |
| --- | --- | --- | --- |
| Node.js | Runs the site's code on your computer | 22.12 or newer (this computer has 24) | `node -v` |
| npm | Installs the libraries the site uses; comes with Node.js | 11 | `npm -v` (pnpm is not used) |
| Git | Downloads the code and records changes | any recent | `git --version` |
| Docker Desktop | Runs the local database inside a container (a small, isolated box on your computer) | any recent | `docker version` |
| Chrome | The browser Lighthouse uses to measure speed | any recent | open Chrome |
| VS Code with Claude Code | The code editor and the AI assistant | current | |

Windows notes: use PowerShell or Git Bash (both are terminals, windows where you type commands). In PowerShell, call `npm.cmd` if script execution is blocked. In Git Bash, paths that start with `/` are rewritten; prefix such commands with `MSYS_NO_PATHCONV=1`.

## 2. Accounts

The live demo uses a few outside services. None is needed on your own computer: the last column is what replaces each one locally.

| Account | What it is | Needed for | State (2026-11-07) | Local stand-in |
| --- | --- | --- | --- | --- |
| Neon (PostgreSQL, Singapore) | Hosts the database online | The demo database | Live | Docker Postgres (section 6) |
| Vercel (Hobby) | Hosts and runs the website | Hosting the demo, Blob storage for photos, cron | Live | `npm run dev` and photos in `data/menu-photos/` |
| PayMongo (test keys only) | A Philippine payment company | GCash, Maya and Card in Test Mode | None: PayMongo paused new sign-ups; the demo runs `fake` (ADR 0003) | The `fake` payment provider |
| Resend | Sends emails | Sign-in links and order emails | Skipped until a domain exists (`docs/07-ROADMAP.md` section 4) | Emails written to the terminal and `data/mail/` |
| Google Cloud OAuth client | Lets people sign in with their Google account | "Sign in with Google" | Live, Production only (section 9, step 7) | Email link sign-in only |

Use accounts owned by the project, never a work account. Keep keys only in `.env.local` and the hosting dashboard.

## 3. Get the code

These steps copy the project to your computer and install what it needs. Run them in a terminal, in the folder where you keep projects.

1. Copy the project from GitHub and go into its folder:

   ```powershell
   git clone https://github.com/xtiannjose/Hoshikopi.git
   cd Hoshikopi
   ```

   You should see Git report the download, and a new folder named `Hoshikopi`.

2. Install the libraries:

   ```powershell
   npm install                       # also generates the Prisma client
   ```

   You should see npm finish without errors, then Prisma report that it generated its client.

3. Install the browser the end-to-end tests use:

   ```powershell
   npx playwright install chromium   # for the browser tests
   ```

   You should see Playwright download Chromium and finish without errors.

4. Make your settings file. Copy `.env.example` to `.env.local` (in PowerShell: `Copy-Item .env.example .env.local`) and set `BETTER_AUTH_SECRET` (section 5). You should see a new file `.env.local` next to `.env.example`.

5. Make the test settings file. Create `.env.test` too: it is git-ignored (Git never saves it), so a clone never has it, and `npm test` refuses to run without it. Put these lines in it:

   ```
   DATABASE_URL=postgresql://postgres:dev@127.0.0.1:5434/hoshikopi_test
   DIRECT_URL=postgresql://postgres:dev@127.0.0.1:5434/hoshikopi_test
   BETTER_AUTH_SECRET=<32 or more random characters>
   BETTER_AUTH_URL=http://localhost:3000
   PAYMENT_PROVIDER=fake
   ```

6. Set up the database: follow section 6.

`next dev` writes a block into `AGENTS.md` that tells agents to read the bundled Next.js docs; keep it and commit it.

## 4. Libraries

A library is code written by others that the project installs from npm. `package.json` is the list, and [`docs/08-TOOLING.md`](08-TOOLING.md) section 4 says why each library is there. Add one only in the batch that needs it and record why in an ADR or that roadmap batch. PayMongo and Resend need no SDK (a library a company publishes for its service): both are plain `fetch` calls to their REST APIs.

Keep `prisma` and `@prisma/client` on the same major version: npm's `latest` tag for `prisma` has run ahead of the client (on 2026-10-31 it was `8.0.0-rc.29` while the client was 7.10.1), so install the CLI with an exact version (`prisma@7.10.1`).

## 5. Environment variables

Environment variables are settings the site reads when it starts, such as the database address and secret keys. On your computer they live in `.env.local`. On the live demo they live in the Vercel dashboard. Copy `.env.example` to `.env.local` and fill in what you have. Never commit `.env*` except `.env.example`.

Two database addresses appear below. A **pooled** URL goes through a connection pooler (a gatekeeper that shares a few database connections among many requests); the running site uses it. A **direct** URL connects straight to the database; migrations (scripts that change the database's shape) need it. Locally both are the same.

| Variable | Example | Needed from |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:dev@127.0.0.1:5434/hoshikopi` | Phase 0 |
| `DIRECT_URL` | Same as above locally; Neon's direct URL later | Phase 0 |
| `BETTER_AUTH_SECRET` | 32+ random characters (`npx @better-auth/cli secret`) | Phase 0 |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Phase 0 |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000`; required on Vercel's Production, where a missing one stops the build instead of sending localhost links; a Preview without it links to its own deployment address (`src/lib/env.ts`) | Phase 0 |
| `PAYMENT_PROVIDER` | `fake` (local and demos) or `paymongo` | Phase 3 |
| `PAYMONGO_SECRET_KEY` | `sk_test_...` only; the app refuses `sk_live_` | Phase 3 |
| `PAYMONGO_WEBHOOK_SECRET` | from the PayMongo dashboard webhook | Phase 3 |
| `RESEND_API_KEY` | `re_...`; empty means emails go to the terminal and `data/mail/` | Phase 2 |
| `MAIL_DIR` | Leave unset. The tests set it so their emails go to `data/mail-test/` (Vitest) and `data/mail-e2e/` (Playwright), each emptied at the start of a run, and `data/mail/` stays yours | Batch 7.5b |
| `MAIL_OUTBOX` | Leave unset. Without Resend, emails go to the terminal and `data/mail/` only in development (`npm run dev`) or when this is `1`, which the tests set; a production server without Resend drops them with a log line, so no live sign-in or Order link sits in files (audit DATA-10) | Phase 11 |
| `MAIL_FROM` | `Hoshikopi <onboarding@resend.dev>` until a domain exists | Phase 2 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | empty turns Google sign-in off | Phase 4 |
| `BLOB_STORE_ID` | Vercel Blob store, set by Vercel when the store is connected (it signs in with Vercel's OIDC token; an older store gives `BLOB_READ_WRITE_TOKEN` instead); empty uses `data/menu-photos/` | Batch 5.4 |
| `CRON_SECRET` | random string; `/api/cron/daily` checks it (Vercel Cron sends it as `Authorization: Bearer <CRON_SECRET>`) | Phase 2 |
| `DATABASE_URL_UNPOOLED` | Set by Vercel's Neon integration: the direct URL migrations use when `DIRECT_URL` is not set (`prisma.config.ts`) | Batch 5.4 |
| `ALLOW_REMOTE_SEED` | `1` only to use a remote (Neon) database from your computer on purpose. Without it, `npm run db:seed` and every Prisma command (`db:migrate`, `db:reset`, `db:studio`, `db:deploy`) refuse any database not on this computer, so a `vercel env pull` can never point them at the live data (`prisma/local-only.ts`, audit DC-03). Vercel's own builds are allowed | Batch 5.4 |
| `E2E_DATABASE_URL` | Leave unset: Playwright uses `hoshikopi_e2e` in the local container (`playwright.config.ts`); set it to run the e2e tests against another database | Phase 2 |
| `FORM_MIN_FILL_MS` | Leave unset. The Inquiry and Event Sign-up forms refuse a post sent faster than 2 seconds; the end-to-end run sets it to `0` (`src/lib/bot-check.ts`) | Batch 10.13 |
| `AUTH_RATE_LIMIT` | Leave unset. `off` turns Better Auth's own rate limit off; only the end-to-end run sets it (`src/modules/identity/internal/auth.ts`) | Batch 10.13 |

## 6. Database

The site keeps its data in PostgreSQL (Postgres), a database program. On your computer, Postgres runs in Docker; the demo uses Neon (section 9). The container uses port 5434 (a numbered door the database listens on), which keeps clear of a native Postgres on 5432 and another local project's container on 5433. There are three local databases: `hoshikopi` for you, `hoshikopi_test` for Vitest and `hoshikopi_e2e` for Playwright.

### First-time setup

1. Start Docker Desktop. You should see it report that the engine is running, and `docker version` print both a Client and a Server section.

2. Create the database container:

   ```powershell
   docker run --name hoshikopi-db -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=hoshikopi -v hoshikopi-pgdata:/var/lib/postgresql/data -p 127.0.0.1:5434:5432 --restart unless-stopped -d postgres:17
   ```

   You should see a long container id. `docker ps` lists `hoshikopi-db` as Up.

3. Create the two test databases:

   ```powershell
   docker exec hoshikopi-db psql -U postgres -c "CREATE DATABASE hoshikopi_test;"
   docker exec hoshikopi-db psql -U postgres -c "CREATE DATABASE hoshikopi_e2e;"
   ```

   You should see `CREATE DATABASE` after each command.

4. Apply the migrations and seed the dev database (load its starting data):

   ```powershell
   npm run db:migrate     # applies migrations to the dev database (Prisma 7 does not seed here)
   npm run db:seed
   npm run db:studio
   ```

   You should see Prisma apply each migration, then `Seed complete.` from the seed. A second seed run says `Already seeded; run npm run db:reset to start over.` instead. `npm run db:studio` opens Prisma Studio, a browser view of the tables, where you can see the seeded menu.

If Docker was restarted and the tests say they cannot reach the database, start the container again with `docker start hoshikopi-db`.

### Seeded accounts

These accounts exist on dev, test and the live demo. They are invented people with `.example` addresses that receive no real mail. There are no passwords: sign in at `/sign-in` with the email. Locally the link appears in the `npm run dev` terminal and in `data/mail/`; on the live demo it appears in the Vercel project's Logs (section 9, step 5).

| Role | Name | Email | Id |
| --- | --- | --- | --- |
| Manager | Christian | `christian@hoshikopi.example` | `seed-manager` |
| Barista | Annika | `annika@hoshikopi.example` | `seed-barista` |
| Member | Hoshi | `hoshi@hoshikopi.example` | `seed-member` |

Staff set up an authenticator app (the Second Factor, ADR 0014) on their first `/manage` visit. A Barista's taps on `/bar` (moving Orders, Sold Out) do not ask for it; a Manager's Pause, Busy Mode and Cancel there do. Tests, the PRD personas and the seed use these same names.

### Test databases and constraints

- Vitest uses `hoshikopi_test` (from `.env.test`, git-ignored) and refuses any database whose name does not end in `_test`. It migrates and seeds it at the start of each run. Outside services (email, Google, Blob, PayMongo, Vercel) are switched off in tests whatever `.env.local` holds (`tests/no-outside-services.mts`, audit DC-04).
- Playwright uses `hoshikopi_e2e`, migrated, reset and seeded before each run. It refuses to start after 10 PM Manila time, since a run would reach the demo's 11:15 PM Last Order or midnight (`tests/e2e/time-guard.ts`, audit DC-42). A test that fails once is tried again and, if it passes, reported as "flaky" (a timing problem, often a busy computer), so one slow moment no longer stops the `@cafe-wide` tests that wait for the rest (audit DC-44). A committed `test.only` fails the run (audit DC-43). Avoid running other heavy work (Vitest, builds) during a browser run.
- The migrations add the CHECK constraints and unique indexes in [`docs/04-DATA-MODEL.md`](04-DATA-MODEL.md) section 4 by hand where Prisma cannot express them: the first migration, and later ones such as `20261116000000_database_rules`.

### A Staff member lost their authenticator phone

([ADR 0014](adr/0014-staff-second-factor-in-identity.md)) Delete their Second Factor and they enrol again on the next `/manage` visit.

1. Run this, with their email in place of Christian's:

   ```powershell
   docker exec hoshikopi-db psql -U postgres -d hoshikopi -c "DELETE FROM two_factors WHERE user_id = (SELECT id FROM users WHERE email = 'christian@hoshikopi.example');"
   ```

   You should see `DELETE 1`. `DELETE 0` means that person had no Second Factor or the email is wrong.

2. They open `/manage`. You should see the page ask them to set up the authenticator app again.

## 7. Everyday commands

These are the commands you use day to day, defined in `package.json` (Phase 0). Run them in the project folder.

| Command | What it does |
| --- | --- |
| `npm run dev` | Site at http://localhost:3000 |
| `npm test` | Vitest once: unit and database tests against `hoshikopi_test` |
| `npm run qa` | Lint, Prettier check, type check, unit tests, production build, `npm run audit` |
| `npm run audit` | `npm audit --omit=dev`: fails on a high or critical advisory, except the few in `scripts/audit.mjs` that reach only the test runner (each with its reason, removed once fixed) |
| `npm run test:e2e` | Resets and seeds `hoshikopi_e2e`, builds, serves on port 3100, runs Playwright with axe at 375 and 1280 px |
| `npm run qa:full` | `qa` plus the browser tests (they build their own copy against `hoshikopi_e2e`) |
| `npm run format` | Prettier writes every file it checks (Markdown is left alone) |
| `npm run db:migrate` | Applies new migrations to the dev database (`prisma migrate dev`) |
| `npm run db:seed` | Seeds the dev database once; refuses a remote one without `ALLOW_REMOTE_SEED=1` (so do the other `db:` commands) |
| `npm run db:studio` | Opens Prisma Studio, a browser view of the dev database |
| `npm run db:reset` | Drops, migrates and seeds the dev database (asks first) |

To look at the site:

1. Run `npm run dev`. You should see Next.js print `Ready` and the address http://localhost:3000.
2. Open http://localhost:3000 in a browser. You should see the Home page with the seeded menu.
3. Press Ctrl+C in the terminal when you are done. You should see the prompt come back. Stop every server you start (ports in [`docs/08-TOOLING.md`](08-TOOLING.md) section 3).

## 8. GitHub

GitHub is the website that holds the project's code. It is the only copy of the project: `origin` is https://github.com/xtiannjose/Hoshikopi (public, so nothing secret goes in). Work happens on a branch (a separate line of changes), one per batch. A pull request asks to merge a branch into `main`, the main line.

When asked to publish a batch:

1. Push the batch branch:

   ```
   git push -u origin <branch>
   ```

   You should see Git report the branch was pushed to `origin`.

2. Open a pull request into `main`:

   ```
   gh pr create --base main --head <branch>
   ```

   You should see the pull request's address printed.

3. Wait for CI (described below) to pass. Check with `gh pr checks <number>`. You should see every check marked as passed. Merge only when it is green.

4. The owner merges it on GitHub with "Create a merge commit".

5. Update the local copy with `git switch main` and `git pull`. You should see Git bring in the merge.

To set up on another computer, clone it (section 3).

**CI** (continuous integration: checks GitHub runs on every change; `.github/workflows/ci.yml`, batch 7.11a) runs on every pull request and on `main`: lint, formatting, the type check, Vitest against a Postgres 17 service, a production build (`npm run build`, which renders every prerendered page, audit DC-02), and the dependency audit (`npm run audit`, high and critical only; see the table above). Playwright stays local (`npm run test:e2e`): it builds and serves the app and depends on the Manila clock.

**Dependabot** (`.github/dependabot.yml`), a GitHub robot that keeps libraries up to date, opens grouped weekly pull requests for npm packages and the GitHub Actions. Review and merge them like any other.

## 9. Demo deploy

The live demo runs on Vercel with its database on Neon (batch 5.4, live since 2026-11-01). This section says what the hosting does by itself, the one big risk with preview builds, and the steps to set it up from nothing.

### What Vercel does on its own

- **Build.** `vercel.json` runs `prisma migrate deploy` before `next build` on Production builds only. Preview builds share the production database unless the Neon integration gives each preview its own branch (ADR 0004), so they never migrate it.
- **Daily cron.** `vercel.json` calls `/api/cron/daily` at 22:00 UTC. Vercel Hobby fires it some time between 6:00 and 6:59 AM Manila, before opening. The cron expires and cancels leftover Orders, deletes rate-limit rows older than a day and guest Carts untouched for 30 days, and refreshes the menu.
- **Demo upkeep.** In Demo Mode the cron also moves the seeded demo Events forward by whole weeks once they end (clearing their Sign-ups). It renews the demo Promo and Seasonal drink once they lapse, so nobody has to re-date them. Anything a Manager made or took off is left alone.
- **Preview links.** A Preview's links point at its own address (`VERCEL_URL`), not production.

### Previews share the production database

**Previews share the production database** (audit ops:11). A Preview deployment is a test copy of the site that Vercel builds for every pull request. The Neon integration gives previews no database branch of their own, so a Preview reads and writes the live data and never migrates it.

- Use previews for build checks only, never to try flows: an Order placed on a preview is a real row in production.
- A pull request whose code needs a new column fails its Preview check until it is merged (PR #102). Merging is safe because the Production build migrates first.
- To try a migration on a preview, first turn on a database branch per Preview deployment in the Vercel project's Neon integration.

### Setting up the demo, in order

1. **Neon**, through Vercel: in the Vercel project, **Storage**, connect a **Neon** database in Singapore (`ap-southeast-1`). The integration sets `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct, for migrations) in every environment, so there is nothing to copy. By hand instead: create a Neon project and set `DATABASE_URL` to the pooled URL (its host has `-pooler`) and `DIRECT_URL` to the direct one.
   - You should see `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in the Vercel project's environment variables.
   - Neon Free has a monthly compute allowance. Once it is used, Neon suspends the database until the next month and every dynamic page fails. The compute sleeps only after some idle minutes, so anything that queries all day keeps it awake: an open Bar Screen does (close it after service), and the Order page stops asking 3 hours past its Pickup Time. Check the usage in the Neon console now and then.
2. **Resend** (skipped until a domain exists, `docs/07-ROADMAP.md` section 4): create an API key. Until a domain is verified, Resend's test sender delivers only to the Resend account's own address, so only that address would get sign-in emails. The seeded accounts use the Logs (step 5) and everyone else signs in with Google (step 7). Without a key, emails to real addresses on Vercel are dropped (their sign-in links never go to the logs).
3. **Vercel**: import `xtiannjose/Hoshikopi` from GitHub. In **Project Settings**, set **Functions**, Function Region to Singapore (`sin1`), next to the database (the default, Washington `iad1`, adds a round trip to every query). Node.js 24.x comes from `package.json` (`"engines": { "node": "24.x" }`, audit ops:16), which Vercel follows over the **General**, Node.js Version setting. Then set these variables for Production and Preview (the database ones come from step 1):

   | Variable | Value |
   | --- | --- |
   | `BETTER_AUTH_SECRET` | new: `npx @better-auth/cli secret` (never reuse the local one) |
   | `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL` | `https://<project>.vercel.app`, Production only: a Preview links to its own address |
   | `PAYMENT_PROVIDER` | `fake` (refuses any domain but `*.vercel.app` and previews) |
   | `CRON_SECRET` | 32+ random characters |
   | `RESEND_API_KEY`, `MAIL_FROM` | from step 2 (not set while Resend is skipped) |

   You should see each variable listed under the project's environment variables.

4. **Deploy** (the build runs the migrations; it reads Neon's `DATABASE_URL_UNPOOLED` when `DIRECT_URL` is not set). Then seed the menu once from your computer with the Neon direct URL:

   ```powershell
   $env:DATABASE_URL="<direct>"; $env:DIRECT_URL="<direct>"; $env:ALLOW_REMOTE_SEED="1"; npm run db:seed
   ```

   You should see the deployment finish in the Vercel dashboard and the seed print `Seed complete.`. The live site then shows the menu.

5. **Sign in as a demo account**: on the live site, ask for a link for one of the seeded accounts (section 6). Then open the Vercel project's **Logs**, find `[email] demo account <email>` and open the link under it. Or sign in with Google (step 7) and make that account a Manager in the Neon SQL editor: `UPDATE users SET role = 'manager' WHERE email = '<your email>';`. After that, give other people roles at `/manage/staff`. You should see the first `/manage` visit ask you to set up the Second Factor.
6. **Blob** (for photo uploads): in the Vercel project, **Storage**, **Create Storage**, **Blob**, Public access, connected to Production, Preview and Development. Vercel adds `BLOB_STORE_ID` (and `BLOB_WEBHOOK_PUBLIC_KEY`, unused) and the store signs in with the deployment's OIDC token, so there is no secret to copy. Created 2026-11-07 as `hoshikopi-photos`. Uploads in `/manage` then go to `menu/` in the store, and `next/image` fetches them (`images.remotePatterns` in `next.config.ts`, which allows only this store's host, worked out from `BLOB_STORE_ID` at build time). Locally there is no OIDC token without `vercel env pull`, so uploads go to `data/menu-photos/` and `/menu-photos/<name>` serves them. You should see `BLOB_STORE_ID` in the project's variables, and an uploaded photo on its Menu Item page.
7. **Google sign-in** (done 2026-11-07):
   1. In Google Cloud, a project "Hoshikopi".
   2. **OAuth consent screen** (Google Auth Platform): External, then **Branding** (app name, support email, home page `https://hoshikopi.vercel.app`, privacy policy `https://hoshikopi.vercel.app/privacy`, authorized domain `hoshikopi.vercel.app`, no logo, which would need Google's review), then **Audience**, **Publish app**.
   3. **Clients**, **Create client**, Web application: JavaScript origins `https://hoshikopi.vercel.app` and `http://localhost:3000`, redirect URIs `https://hoshikopi.vercel.app/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google`.
   4. In Vercel set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (Sensitive) for Production only (preview addresses change, so Google would refuse them), then redeploy.

   You should see the sign-in page show Continue with Google.
8. **Check**: Lighthouse on Home, `/menu` and a Menu Item with PageSpeed Insights against the budgets (`docs/05-DESIGN-SYSTEM.md` section 11), and the two-minute demo script (PRD section 8). You should see each score beside its budget (note any that miss), and the demo script run from start to end.

### Backups and restore

(audit ops:2) Neon keeps a short history of the database, so a recent mistake can be undone. Neon Free keeps 6 hours of history. Neon's point-in-time restore (in the Neon console) brings the database back to any moment in that window. Before merging a pull request with a migration, make a snapshot: create a Neon branch from the production branch (delete it a few days later). A mistake noticed after 6 hours can only be fixed forward. A paid plan with longer history is on the PRD's Becoming real list.

### Migrations work with the previous build

(audit ops:3) `prisma migrate deploy` runs before `next build`, so the new schema is live while the old code still serves, and it stays if the build fails or a deployment is rolled back. So add first (a new column nullable or with a default), drop or rename only in a later release once no code reads it, and fix forward instead of rolling back past a migration.

### When something needs a person

Vercel Hobby keeps runtime logs for an hour and sends no alerts. A payment that needs a Refund by hand shows as **Needs a refund** at the top of `/manage/orders` until a Manager refunds it, so open that page with the day. Server errors are one JSON line each in **Logs** (search `"level":"error"`).
