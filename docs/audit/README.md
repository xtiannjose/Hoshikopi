# Hoshikopi audit, November 2026

A deep check of the whole project as a senior web developer, a security reviewer and a QA tester: errors, bugs, inconsistencies, inefficiencies, vulnerabilities, gaps, improvements and features worth adding. It runs as a Claude Code workflow: specialist reviewers each cover one area, a second reviewer tries to disprove every finding, and a final pass merges and ranks what survives into a P0 to P3 backlog.

## Status (2026-11-06)

In progress. Two runs stopped on Claude usage limits before the double-check and ranking steps.

| File | What it holds |
| --- | --- |
| [2026-11-06-interim.md](2026-11-06-interim.md) | 182 findings from 6 of 16 areas, readable, **not yet verified** |
| [findings-2026-11-06.json](findings-2026-11-06.json) | The same findings as data, read by the next run |
| [workflow.md](workflow.md) | The workflow script that finishes the audit |

**Done**

- Quality gates on 2026-11-05, all passing: lint, Prettier, type check, Vitest (193 tests in 36 files), production build, `npm audit --omit=dev` (0 vulnerabilities), Playwright (159 passed, 35 skipped). `npm audit` with dev dependencies exits 1; not looked at yet.
- Areas reviewed: ordering core, payments, identity and access (2 passes), web security (2 passes), performance, UI (2 passes).

**Still to do**

1. Review the 10 remaining areas: accessibility, architecture and code quality, data model, tests, docs, product features and competitor research, motion, ops and deploy readiness (batch 5.4), Staff tools (`/manage`, `/bar`), customer journeys.
2. Double-check every finding, the 182 above included.
3. Merge duplicates and rank everything into the final backlog: `docs/audit/2026-11-XX.md`, which replaces the interim file.

## How to continue

On this computer, in a Claude Code session in the Hoshikopi folder:

1. Start Docker Desktop. The `hoshikopi-db` container (port 5434) already has `hoshikopi`, `hoshikopi_test` and `hoshikopi_e2e`, migrated and seeded. `.env.local` and `.env.test` exist on this computer only (git-ignored); on another computer, follow `docs/06-SETUP.md` sections 5 and 6.
2. Serve a production build for the reviewers on port 3300 (PowerShell), and stop it when the audit is done:

   ```powershell
   $env:BETTER_AUTH_URL = "http://localhost:3300"; $env:NEXT_PUBLIC_SITE_URL = "http://localhost:3300"
   npx next build
   npx next start -p 3300
   ```

3. Re-run the quality gates if the code changed since 2026-11-05 (`npm run qa`, `npm run test:e2e`) and save their output where the workflow's `gates` argument points.
4. Ask Claude to run the workflow in [workflow.md](workflow.md) with the arguments listed there. It skips the 6 reviewed areas, reads their findings from the JSON file, and verifies and ranks everything.

A cheaper fallback when usage is tight: skip step 4's new areas and only verify and rank the 182 findings (pass an empty `todo` list).
