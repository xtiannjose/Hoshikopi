# Hoshikopi audit, November 2026

A deep check of the whole project as a senior web developer, a security reviewer and a QA tester: errors, bugs, inconsistencies, inefficiencies, vulnerabilities, gaps, improvements and features worth adding. It runs as a Claude Code workflow: specialist reviewers each cover one area, a second reviewer tries to disprove every finding, and a final pass merges and ranks what survives into a P0 to P3 backlog.

## Status (2026-11-10)

In progress (batch 7.5). Three runs stopped (two on Claude usage limits, one when the session ended) before the double-check and ranking steps. On 2026-11-10 three more areas were reviewed one at a time, on `main` at `0aa0462`, after Phases 7 and 8 had fixed many of the earlier findings.

| File | What it holds |
| --- | --- |
| [2026-11-06-interim.md](2026-11-06-interim.md) | 236 findings from 9 of 16 areas, readable, **not yet verified** |
| [findings-2026-11-06.json](findings-2026-11-06.json) | The same findings as data, read by the next run |
| [findings-2026-11-10.json](findings-2026-11-10.json) | 135 findings from the last 7 areas (accessibility 15, customer journeys 23, motion 12, ops and deploy readiness 20, tests 18, architecture and code quality 24, Staff tools 23) |
| [verdicts-2026-11-06.json](verdicts-2026-11-06.json) | Checker verdicts on the 2026-11-06 findings, keyed by id, filled batch by batch. Batch A (45 findings believed fixed in 7.1 to 8.10): 28 fixed, 17 partly fixed, each with the proof or what remains. Batch B (41 findings that repeat a checked 2026-11-10 finding): marked "duplicate", with the 2026-11-10 finding they merge into. Batch C-1 (8 open ordering, payment and identity findings): 7 partly, 1 out of scope, all now low |
| [verdicts-2026-11-10.json](verdicts-2026-11-10.json) | A checker's verdict on each of those 135, keyed by area and finding number: 69 confirmed, 61 partly, 4 out of scope, 1 refuted, with adjusted severity, plain problem and fix, and duplicates to merge |
| [workflow.md](workflow.md) | The workflow script that finishes the audit |

**Done**

- Quality gates on 2026-11-10, all passing: lint, Prettier, type check, Vitest (228 tests in 39 files), production build, `npm audit` with and without dev dependencies (0 vulnerabilities), Playwright (180 passed, 38 skipped; the skips are deliberate phone-only or desktop-only tests).
- Areas reviewed on 2026-11-06: ordering core, payments, identity and access (2 passes), web security (2 passes), performance, UI (2 passes), data model, docs, product features and competitor research.
- Areas reviewed on 2026-11-10: accessibility, customer journeys, motion (graded with the free `motion` and `apple-design` skills, since Motion+ is not signed in), and ops and deploy readiness (read-only checks of the live demo; the Vercel and Neon dashboards were not reachable). The journeys reviewer saw ORD-01, ORD-02 and UI1-01 fixed in the running app; the ops reviewer saw the deploy-related SEC1-01, SEC1-02, SEC1-03, SEC2-01, SEC2-04, DATA-05 and PERF-04 fixed, and found the live functions in `sin1`, so DATA-01's cross-region timeout does not happen live. The tests reviewer ran mutants (code changed on purpose) against the suite: the race tests catch removed locks, but a Prep Time that ignores the bar's queue and a Refund that takes Stars below zero both pass every test. It also traced the flaky Playwright run to four causes (shared cafe-wide changes, the never-emptied `data/mail`, old emails satisfying the ORD-10 check, and the Manila clock after about 21:15).

The architecture reviewer found the module boundaries holding (no deep imports, no cycles, Order Status written only in `status.ts`) and one real bug: the public menu crashes when a Category slug has no stand-in icon.

The Staff tools reviewer found access control holding on every Manager-only Server Action, including the 8.4 and 8.5 ones. It changed cafe-wide settings to test them and put each back (checked in the database). It left "AUDIT TEST" entities in the dev database because the Staff tools have no delete: two hidden Menu Items, Orders K-018 to K-022 (K-022 counts PHP 175 in that day's sales) and a net-zero Star adjustment, besides the ones from 6 November.

All 16 areas are now reviewed.

On 2026-11-13 a skeptical checker opened the cited code for each of the 135 findings of 2026-11-10 (12 checkers, 9 to 15 findings each). Of the 130 that hold, the adjusted severities are 2 high, 20 medium, 93 low and 15 info (the reviewers had 3 high and 51 medium). The 2 high: the public menu crashes when a Category slug has no stand-in icon, and the two-minute demo is closed outside Manila ordering hours.

**Still to do**

1. Double-check the 236 findings of 2026-11-06 in four batches: A, the 45 believed fixed by Phases 7 and 8 (done 2026-11-13); B, the 41 that repeat a checked 2026-11-10 finding (mapped 2026-11-13; 16 more were only related, so they moved to C and D); C, the 35 still open at high or medium; D, the 115 still open at low or info. The workflow's prompts still describe the code as of 2026-11-06: reuse the checker brief from 2026-11-13 instead.
2. Merge duplicates and rank everything into the final backlog: `docs/audit/2026-11-XX.md`, which replaces the interim file. Findings fixed in 7.1 to 7.4 (and later batches) are marked fixed there.

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
