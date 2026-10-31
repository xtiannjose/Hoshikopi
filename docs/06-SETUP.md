# Setup Guide

Status: draft v0.1, 2026-10-30. How to get Hoshikopi running on this computer. Phase 0 of `docs/07-ROADMAP.md` follows these steps; update this guide when a step changes. Every outside account is optional at first: each has a local stand-in, so the whole site runs with no sign-ups.

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

## 2. Accounts (optional until the phase that needs them)

| Account | Needed for | Phase | Local stand-in until then |
| --- | --- | --- | --- |
| Neon (PostgreSQL, Singapore) | The demo database | 5.4 | Docker Postgres (section 6) |
| Vercel (Hobby) | Hosting the demo, Blob storage for photos, cron | 5.4 | `npm run dev` and photos in `public/menu/` |
| PayMongo (test keys only) | GCash, Maya and Card in Test Mode | 3 | The `fake` payment provider |
| Resend | Sign-in links and order emails | 2 | Emails written to the terminal and `data/mail/` |
| Google Cloud OAuth client | "Sign in with Google" | 4 | Email link sign-in only |

Use accounts owned by the project, never a work account; keep keys only in `.env.local` and the hosting dashboard.

## 3. Scaffold the app

This folder already holds the documents, and the Next.js scaffolder refuses to write into a folder with files that could conflict. Scaffold in a sibling folder, then copy in without overwriting (the same method Hoshimono used):

```powershell
cd D:\Coding\projects\Personal
npx create-next-app@latest hoshikopi-scaffold --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git
robocopy hoshikopi-scaffold Hoshikopi /E /XC /XN /XO /XD node_modules .next /L
robocopy hoshikopi-scaffold Hoshikopi /E /XC /XN /XO /XD node_modules .next
Remove-Item -Recurse -Force hoshikopi-scaffold
cd Hoshikopi
npm install
npm run dev
```

Run the first `robocopy` (with `/L`, a dry run) and read the list before the real copy. Open http://localhost:3000 to see the default page, then stop the server. Remove the default page content and SVGs, and swap the Geist fonts for Fraunces and Plus Jakarta Sans (`docs/05-DESIGN-SYSTEM.md` section 4).

`next dev` writes a block into `AGENTS.md` that tells agents to read the bundled Next.js docs; keep it and commit it.

## 4. Install the libraries

Install by phase so the dependency list always matches what the code uses. Check each library's current install guide as you go; record any new dependency in an ADR or the roadmap batch that adds it.

```powershell
# Phase 0: data, auth and quality
npm install @prisma/client better-auth zod
npm install -D prisma tsx vitest @playwright/test @axe-core/playwright prettier prettier-plugin-tailwindcss
npx playwright install chromium

# Phase 0: UI basics (only what a page needs; native elements first)
npm install @phosphor-icons/react
npx shadcn@latest init        # neutral base, CSS variables on; then replace colours with docs/05 tokens

# Later phases
# Phase 1: react-markdown (Posts and Events)
# Phase 2: resend
# Phase 3: no PayMongo SDK needed (plain fetch to the REST API)
```

Keep `prisma` and `@prisma/client` on the same major version (Hoshimono found the CLI tagged ahead of the client once). It happened again on 2026-10-31: npm's `latest` tag for `prisma` was `8.0.0-rc.29` while the client was 7.10.1, so install the CLI with an exact version (`prisma@7.10.1`).

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
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob; empty uses `public/menu/` | Batch 5.4 |
| `CRON_SECRET` | random string; `/api/cron/daily` checks it | Phase 2 |

## 6. Database

Local Postgres in Docker while the Neon account waits. Port 5434 keeps clear of Hoshimono's 5433 and a native Postgres on 5432:

```powershell
docker run --name hoshikopi-db -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=hoshikopi -v hoshikopi-pgdata:/var/lib/postgresql/data -p 127.0.0.1:5434:5432 --restart unless-stopped -d postgres:17
docker exec hoshikopi-db psql -U postgres -c "CREATE DATABASE hoshikopi_test;"
docker exec hoshikopi-db psql -U postgres -c "CREATE DATABASE hoshikopi_e2e;"
```

Then, once `prisma/schema.prisma` exists (Phase 0):

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
| `npm run perf` | Lighthouse mobile on Home and the menu (as on the iOne website) |

## 8. Project copies: GitHub and Google Drive

GitHub is the remote: `origin` is https://github.com/xtiannjose/Hoshikopi (public, so nothing secret goes in). When asked, push the batch branch and open a pull request into `main`; the owner merges it on GitHub with "Create a merge commit":

```
git push -u origin <branch>
gh pr create --base main --head <branch>
```

After a merge, update the local copy with `git switch main` and `git pull`.

The backup is one git bundle of every branch, synced by Google Drive for desktop (remote `drive`):

```
git bundle create "G:/My Drive/Coding Projects/Personal/Hoshikopi/hoshikopi.bundle" --all
git bundle verify "G:/My Drive/Coding Projects/Personal/Hoshikopi/hoshikopi.bundle"
```

Refresh it only when asked, after commits or a merge. To restore on another computer, clone the bundle into a short folder path, then `git switch main`:

```
git clone "G:\My Drive\Coding Projects\Personal\Hoshikopi\hoshikopi.bundle" Hoshikopi
```

## 9. Demo deploy (batch 5.4, needs the owner's accounts)

The code is ready for Vercel: `vercel.json` runs `prisma migrate deploy` before `next build` and calls `/api/cron/daily` at 22:00 UTC (6:00 AM Manila, before opening). In order:

1. **Neon** (region Singapore): create the project and copy two URLs: the pooled one (host has `-pooler`) and the direct one.
2. **Resend**: create an API key. Until a domain is verified, Resend's test sender delivers only to the Resend account's own address, so only that address can sign in on the demo. Without a key, emails to real addresses on Vercel are dropped (their sign-in links never go to the logs).
3. **Vercel**: import `xtiannjose/Hoshikopi` from GitHub and set these variables for Production and Preview:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled URL |
   | `DIRECT_URL` | Neon direct URL (migrations) |
   | `BETTER_AUTH_SECRET` | new: `npx @better-auth/cli secret` (never reuse the local one) |
   | `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL` | `https://<project>.vercel.app` |
   | `PAYMENT_PROVIDER` | `fake` (refuses any domain but `*.vercel.app` and previews) |
   | `CRON_SECRET` | 32+ random characters |
   | `RESEND_API_KEY`, `MAIL_FROM` | from step 2 |

4. **Deploy** (the build runs the migrations; it reads Neon's `DATABASE_URL_UNPOOLED` when `DIRECT_URL` is not set), then seed the menu once from your computer with the Neon direct URL: `$env:DATABASE_URL="<direct>"; $env:DIRECT_URL="<direct>"; $env:ALLOW_REMOTE_SEED="1"; npm run db:seed`.
5. **Sign in as a demo account**: on the live site, ask for a link for one of the seeded accounts (section 6), then open the Vercel project's **Logs**, find `[email] demo account <email>` and open the link under it. Or use your own email (needs Resend, step 2) and make it a Manager in the Neon SQL editor: `UPDATE users SET role = 'manager' WHERE email = '<your email>';`. The first `/manage` visit asks you to set up the Second Factor.
6. **Blob** (for photo uploads): create a Blob store in the Vercel project, which adds `BLOB_READ_WRITE_TOKEN`; photo uploads to Blob are built and tested then (until then the demo shows the stand-ins and uploads fail on Vercel's read-only disk).
7. **Check**: Lighthouse on Home, `/menu` and a Menu Item with PageSpeed Insights against the budgets (`docs/05-DESIGN-SYSTEM.md` section 11), and the two-minute demo script (PRD section 8).
