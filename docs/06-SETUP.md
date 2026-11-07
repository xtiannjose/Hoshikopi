# Setup Guide

Status: v0.2, 2026-11-07. How to get Hoshikopi running on a computer and how the demo is deployed. Update this guide when a step changes. Every outside account is optional for local work: each has a local stand-in, so the whole site runs with no sign-ups.

## 1. Prerequisites

| Tool | Version | Check |
| --- | --- | --- |
| Node.js | 22.12 or newer (this computer has 24) | `node -v` |
| npm | 11 | `npm -v` (pnpm is not used) |
| Git | any recent | `git --version` |
| Docker Desktop | any recent; for the local database | `docker version` |
| Chrome | any recent; for Lighthouse | open Chrome |
| VS Code with Claude Code | current | |

Windows notes: use PowerShell or Git Bash. In PowerShell, call `npm.cmd` if script execution is blocked. In Git Bash, paths that start with `/` are rewritten; prefix such commands with `MSYS_NO_PATHCONV=1`.

## 2. Accounts

| Account | Needed for | State (2026-11-07) | Local stand-in |
| --- | --- | --- | --- |
| Neon (PostgreSQL, Singapore) | The demo database | Live | Docker Postgres (section 6) |
| Vercel (Hobby) | Hosting the demo, Blob storage for photos, cron | Live | `npm run dev` and photos in `public/menu/` |
| PayMongo (test keys only) | GCash, Maya and Card in Test Mode | None: PayMongo paused new sign-ups; the demo runs `fake` (ADR 0003) | The `fake` payment provider |
| Resend | Sign-in links and order emails | Skipped until a domain exists (`docs/07-ROADMAP.md` section 4) | Emails written to the terminal and `data/mail/` |
| Google Cloud OAuth client | "Sign in with Google" | Live, Production only (section 9, step 7) | Email link sign-in only |

Use accounts owned by the project, never a work account; keep keys only in `.env.local` and the hosting dashboard.

## 3. Get the code

```powershell
git clone https://github.com/xtiannjose/Hoshikopi.git
cd Hoshikopi
npm install                       # also generates the Prisma client
npx playwright install chromium   # for the browser tests
```

Copy `.env.example` to `.env.local` and set `BETTER_AUTH_SECRET` (section 5). Create `.env.test` too: it is git-ignored, so a clone never has it, and `npm test` refuses to run without it. Set `DATABASE_URL` and `DIRECT_URL` to `postgresql://postgres:dev@127.0.0.1:5434/hoshikopi_test`, `BETTER_AUTH_SECRET` to 32+ characters, `BETTER_AUTH_URL=http://localhost:3000` and `PAYMENT_PROVIDER=fake`. Then run the section 6 commands.

`next dev` writes a block into `AGENTS.md` that tells agents to read the bundled Next.js docs; keep it and commit it.

## 4. Libraries

`package.json` is the list and `docs/08-TOOLING.md` section 4 says why each library is there. Add one only in the batch that needs it and record why in an ADR or that roadmap batch. PayMongo and Resend need no SDK: both are plain `fetch` calls to their REST APIs.

Keep `prisma` and `@prisma/client` on the same major version: npm's `latest` tag for `prisma` has run ahead of the client (on 2026-10-31 it was `8.0.0-rc.29` while the client was 7.10.1), so install the CLI with an exact version (`prisma@7.10.1`).

## 5. Environment variables

Copy `.env.example` to `.env.local` and fill in what you have. Never commit `.env*` except `.env.example`.

| Variable | Example | Needed from |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:dev@127.0.0.1:5434/hoshikopi` | Phase 0 |
| `DIRECT_URL` | Same as above locally; Neon's direct URL later | Phase 0 |
| `BETTER_AUTH_SECRET` | 32+ random characters (`npx @better-auth/cli secret`) | Phase 0 |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Phase 0 |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Phase 0 |
| `PAYMENT_PROVIDER` | `fake` (local and demos) or `paymongo` | Phase 3 |
| `PAYMONGO_SECRET_KEY` | `sk_test_...` only; the app refuses `sk_live_` | Phase 3 |
| `PAYMONGO_WEBHOOK_SECRET` | from the PayMongo dashboard webhook | Phase 3 |
| `RESEND_API_KEY` | `re_...`; empty means emails go to the terminal | Phase 2 |
| `MAIL_FROM` | `Hoshikopi <onboarding@resend.dev>` until a domain exists | Phase 2 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | empty turns Google sign-in off | Phase 4 |
| `BLOB_STORE_ID` | Vercel Blob store, set by Vercel when the store is connected (it signs in with Vercel's OIDC token; an older store gives `BLOB_READ_WRITE_TOKEN` instead); empty uses `public/menu/` | Batch 5.4 |
| `CRON_SECRET` | random string; `/api/cron/daily` checks it | Phase 2 |

## 6. Database

Local Postgres in Docker (the demo uses Neon, section 9). Port 5434 keeps clear of a native Postgres on 5432 and another local project's container on 5433:

```powershell
docker run --name hoshikopi-db -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=hoshikopi -v hoshikopi-pgdata:/var/lib/postgresql/data -p 127.0.0.1:5434:5432 --restart unless-stopped -d postgres:17
docker exec hoshikopi-db psql -U postgres -c "CREATE DATABASE hoshikopi_test;"
docker exec hoshikopi-db psql -U postgres -c "CREATE DATABASE hoshikopi_e2e;"
```

Then apply the migrations and seed the dev database:

```powershell
npm run db:migrate     # applies migrations to the dev database (Prisma 7 does not seed here)
npm run db:seed
npm run db:studio
```

**Seeded accounts** (dev, test and the live demo; invented people, `.example` addresses that receive no real mail). There are no passwords: sign in at `/sign-in` with the email; locally the link appears in the `npm run dev` terminal and in `data/mail/`, on the live demo in the Vercel project's Logs (section 9, step 5).

| Role | Name | Email | Id |
| --- | --- | --- | --- |
| Manager | Christian | `christian@hoshikopi.example` | `seed-manager` |
| Barista | Annika | `annika@hoshikopi.example` | `seed-barista` |
| Member | Hoshi | `hoshi@hoshikopi.example` | `seed-member` |

Staff set up an authenticator app (the Second Factor, ADR 0014) on their first `/manage` visit; `/bar` does not ask. Tests, the PRD personas and the seed use these same names.

- Vitest uses `hoshikopi_test` (from `.env.test`, git-ignored) and refuses any database whose name does not end in `_test`.
- Playwright uses `hoshikopi_e2e`, reset and seeded before each run.
- The first migration adds the CHECK constraints and unique indexes in `docs/04-DATA-MODEL.md` section 4 by hand where Prisma cannot express them.
- **A Staff member lost their authenticator phone** (ADR 0014): delete their Second Factor and they enrol again on the next `/manage` visit:

  ```powershell
  docker exec hoshikopi-db psql -U postgres -d hoshikopi -c "DELETE FROM two_factors WHERE user_id = (SELECT id FROM users WHERE email = 'christian@hoshikopi.example');"
  ```

## 7. Everyday commands (defined in Phase 0)

| Command | What it does |
| --- | --- |
| `npm run dev` | Site at http://localhost:3000 |
| `npm run qa` | Lint, Prettier check, type check, unit tests, production build, `npm audit --omit=dev` |
| `npm run test:e2e` | Resets and seeds `hoshikopi_e2e`, builds, serves on port 3100, runs Playwright with axe at 375 and 1280 px |
| `npm run qa:full` | `qa` plus the browser tests (they build their own copy against `hoshikopi_e2e`) |
| `npm run format` | Prettier writes every file it checks (Markdown is left alone) |
| `npm run db:reset` | Drops, migrates and seeds the dev database (asks first) |

## 8. GitHub

GitHub is the only copy of the project: `origin` is https://github.com/xtiannjose/Hoshikopi (public, so nothing secret goes in). When asked, push the batch branch and open a pull request into `main`; the owner merges it on GitHub with "Create a merge commit":

```
git push -u origin <branch>
gh pr create --base main --head <branch>
```

After a merge, update the local copy with `git switch main` and `git pull`. To set up on another computer, clone it (section 3).

## 9. Demo deploy (batch 5.4, live since 2026-11-01)

The code is ready for Vercel: `vercel.json` runs `prisma migrate deploy` before `next build` on Production builds only (Preview builds share the production database unless the Neon integration gives each preview its own branch, ADR 0004, so they never migrate it) and calls `/api/cron/daily` at 22:00 UTC (6:00 AM Manila, before opening). A preview of a branch that changes the schema therefore needs a Neon preview branch: in the Vercel project's Neon integration, turn on a database branch for each Preview deployment. In order:

1. **Neon** (region Singapore): create the project and copy two URLs: the pooled one (host has `-pooler`) and the direct one.
2. **Resend** (skipped until a domain exists, `docs/07-ROADMAP.md` section 4): create an API key. Until a domain is verified, Resend's test sender delivers only to the Resend account's own address, so only that address would get sign-in emails; the seeded accounts use the Logs (step 5) and everyone else signs in with Google (step 7). Without a key, emails to real addresses on Vercel are dropped (their sign-in links never go to the logs).
3. **Vercel**: import `xtiannjose/Hoshikopi` from GitHub and set these variables for Production and Preview:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled URL |
   | `DIRECT_URL` | Neon direct URL (migrations) |
   | `BETTER_AUTH_SECRET` | new: `npx @better-auth/cli secret` (never reuse the local one) |
   | `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL` | `https://<project>.vercel.app` |
   | `PAYMENT_PROVIDER` | `fake` (refuses any domain but `*.vercel.app` and previews) |
   | `CRON_SECRET` | 32+ random characters |
   | `RESEND_API_KEY`, `MAIL_FROM` | from step 2 (not set while Resend is skipped) |

4. **Deploy** (the build runs the migrations; it reads Neon's `DATABASE_URL_UNPOOLED` when `DIRECT_URL` is not set), then seed the menu once from your computer with the Neon direct URL: `$env:DATABASE_URL="<direct>"; $env:DIRECT_URL="<direct>"; $env:ALLOW_REMOTE_SEED="1"; npm run db:seed`.
5. **Sign in as a demo account**: on the live site, ask for a link for one of the seeded accounts (section 6), then open the Vercel project's **Logs**, find `[email] demo account <email>` and open the link under it. Or sign in with Google (step 7) and make that account a Manager in the Neon SQL editor: `UPDATE users SET role = 'manager' WHERE email = '<your email>';`; after that, give other people roles at `/manage/staff`. The first `/manage` visit asks you to set up the Second Factor.
6. **Blob** (for photo uploads): in the Vercel project, **Storage**, **Create Storage**, **Blob**, Public access, connected to Production, Preview and Development. Vercel adds `BLOB_STORE_ID` (and `BLOB_WEBHOOK_PUBLIC_KEY`, unused) and the store signs in with the deployment's OIDC token, so there is no secret to copy. Created 2026-11-07 as `hoshikopi-photos`. Uploads in `/manage` then go to `menu/` in the store, and `next/image` fetches them (`images.remotePatterns` in `next.config.ts`). Locally there is no OIDC token without `vercel env pull`, so uploads keep going to `public/menu/`.
7. **Google sign-in** (done 2026-11-07): in Google Cloud, a project "Hoshikopi"; **OAuth consent screen** (Google Auth Platform): External, then **Branding** (app name, support email, home page `https://hoshikopi.vercel.app`, privacy policy `https://hoshikopi.vercel.app/privacy`, authorized domain `hoshikopi.vercel.app`, no logo, which would need Google's review), then **Audience**, **Publish app**. **Clients**, **Create client**, Web application: JavaScript origins `https://hoshikopi.vercel.app` and `http://localhost:3000`, redirect URIs `https://hoshikopi.vercel.app/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google`. In Vercel set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (Sensitive) for Production only (preview addresses change, so Google would refuse them), then redeploy. The sign-in page then shows Continue with Google.
8. **Check**: Lighthouse on Home, `/menu` and a Menu Item with PageSpeed Insights against the budgets (`docs/05-DESIGN-SYSTEM.md` section 11), and the two-minute demo script (PRD section 8).
