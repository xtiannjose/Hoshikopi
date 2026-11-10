# Hoshikopi audit, November 2026

A deep check of the whole project as a senior web developer, a security reviewer and a QA tester: errors, bugs, inconsistencies, inefficiencies, vulnerabilities, gaps, improvements and features worth adding. It runs as a Claude Code workflow: specialist reviewers each cover one area, a second reviewer tries to disprove every finding, and a final pass merges and ranks what survives into a P0 to P3 backlog.

## Status (2026-11-10)

In progress (batch 7.5). Three runs stopped (two on Claude usage limits, one when the session ended) before the double-check and ranking steps. On 2026-11-10 three more areas were reviewed one at a time, on `main` at `0aa0462`, after Phases 7 and 8 had fixed many of the earlier findings.

| File | What it holds |
| --- | --- |
| [2026-11-06-interim.md](2026-11-06-interim.md) | 236 findings from 9 of 16 areas, readable, **not yet verified** |
| [findings-2026-11-06.json](findings-2026-11-06.json) | The same findings as data, read by the next run |
| [findings-2026-11-10.json](findings-2026-11-10.json) | 50 findings from 3 more areas (accessibility 15, customer journeys 23, motion 12), **not yet verified** |
| [workflow.md](workflow.md) | The workflow script that finishes the audit |

**Done**

- Quality gates on 2026-11-10, all passing: lint, Prettier, type check, Vitest (228 tests in 39 files), production build, `npm audit` with and without dev dependencies (0 vulnerabilities), Playwright (180 passed, 38 skipped; the skips are deliberate phone-only or desktop-only tests).
- Areas reviewed on 2026-11-06: ordering core, payments, identity and access (2 passes), web security (2 passes), performance, UI (2 passes), data model, docs, product features and competitor research.
- Areas reviewed on 2026-11-10: accessibility, customer journeys, and motion (graded with the free `motion` and `apple-design` skills, since Motion+ is not signed in). The journeys reviewer saw ORD-01, ORD-02 and UI1-01 fixed in the running app.

**Still to do**

1. Review the 4 remaining areas, smallest first: ops and deploy readiness (batch 5.4), tests, architecture and code quality, Staff tools (`/manage`, `/bar`). With the workflow, pass `todo: ["ops", "tests", "architecture", "staff"]`. Its reviewer brief still describes the code as of 2026-11-06 (Phase 7 open, older test counts): update that text first.
2. Double-check every finding, both JSON files included (the workflow reads one `priorPath`, so run it once per file or merge them).
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
4. Ask Claude to run the workflow in [workflow.md](workflow.md) with the arguments listed there. It skips the reviewed areas, reads their findings from the JSON file, and verifies and ranks everything.

A cheaper fallback when usage is tight: skip step 4's new areas and only verify and rank the saved findings (pass an empty `todo` list).
