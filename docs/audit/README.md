# Hoshikopi audit, November 2026

A deep check of the whole project as a senior web developer, a security reviewer and a QA tester: errors, bugs, inconsistencies, inefficiencies, vulnerabilities, gaps, improvements and features worth adding. It runs as a Claude Code workflow: specialist reviewers each cover one area, a second reviewer tries to disprove every finding, and a final pass merges and ranks what survives into a P0 to P3 backlog.

## Status (2026-11-13)

Finished, apart from the flaky Playwright fix that batch 7.5 also asks for. **Start with [2026-11-13.md](2026-11-13.md), the ranked backlog.** The first three workflow runs stopped (two on Claude usage limits, one when the session ended) before the double-check and ranking steps, so the rest was done in smaller steps: the last 7 areas one at a time on 2026-11-10 (on `main` at `0aa0462`, after Phases 7 and 8 had fixed many of the earlier findings), then the double-check and ranking on 2026-11-13.

| File | What it holds |
| --- | --- |
| [2026-11-13.md](2026-11-13.md) | **The ranked backlog**: 205 open items (2 P0, 18 P1, 142 P2, 43 P3), the proposed batches 7.7 to 7.11, and the closed findings |
| [2026-11-06-interim.md](2026-11-06-interim.md) | The 236 findings of 2026-11-06 from 9 areas, with full evidence (kept as the record behind the backlog) |
| [findings-2026-11-06.json](findings-2026-11-06.json) | The same findings as data |
| [findings-2026-11-10.json](findings-2026-11-10.json) | 135 findings from the last 7 areas (accessibility 15, customer journeys 23, motion 12, ops and deploy readiness 20, tests 18, architecture and code quality 24, Staff tools 23) |
| [verdicts-2026-11-06.json](verdicts-2026-11-06.json) | A checker's verdict on each of the 236 findings of 2026-11-06, keyed by id: 48 fixed, 41 duplicates of a 2026-11-10 finding, 50 confirmed, 83 partly, 14 out of scope. Batch A (45 findings believed fixed in 7.1 to 8.10): 28 fixed, 17 partly fixed, each with the proof or what remains. Batch B (41 findings that repeat a checked 2026-11-10 finding): marked "duplicate", with the 2026-11-10 finding they merge into. Batch C-1 (8 open ordering, payment and identity findings): 7 partly, 1 out of scope, all now low. Batch C-2 (7 open security, performance and data findings): 3 confirmed, 4 partly, all now low or info. Batch C-3 (11 UI findings): 4 confirmed, 1 partly, 3 fixed by 8.10, 3 out of scope (photos on hold, the Cancel confirm dropped on purpose). Batch C-4 (9 docs and feature findings): 3 fixed, 4 partly, 1 confirmed, 1 out of scope. Batch D (115 low and info findings, 7 checkers): none raised to medium; several fixed by Phases 7 and 8, the rest low or info |
| [verdicts-2026-11-10.json](verdicts-2026-11-10.json) | A checker's verdict on each of those 135, keyed by area and finding number: 69 confirmed, 61 partly, 4 out of scope, 1 refuted, with adjusted severity, plain problem and fix, and duplicates to merge |
| [workflow.md](workflow.md) | The workflow script the first runs used; kept for a future audit (its prompts describe the code as of 2026-11-06) |

**Done**

- Quality gates on 2026-11-10, all passing: lint, Prettier, type check, Vitest (228 tests in 39 files), production build, `npm audit` with and without dev dependencies (0 vulnerabilities), Playwright (180 passed, 38 skipped; the skips are deliberate phone-only or desktop-only tests).
- Areas reviewed on 2026-11-06: ordering core, payments, identity and access (2 passes), web security (2 passes), performance, UI (2 passes), data model, docs, product features and competitor research.
- Areas reviewed on 2026-11-10: accessibility, customer journeys, motion (graded with the free `motion` and `apple-design` skills, since Motion+ is not signed in), and ops and deploy readiness (read-only checks of the live demo; the Vercel and Neon dashboards were not reachable). The journeys reviewer saw ORD-01, ORD-02 and UI1-01 fixed in the running app; the ops reviewer saw the deploy-related SEC1-01, SEC1-02, SEC1-03, SEC2-01, SEC2-04, DATA-05 and PERF-04 fixed, and found the live functions in `sin1`, so DATA-01's cross-region timeout does not happen live. The tests reviewer ran mutants (code changed on purpose) against the suite: the race tests catch removed locks, but a Prep Time that ignores the bar's queue and a Refund that takes Stars below zero both pass every test. It also traced the flaky Playwright run to four causes (shared cafe-wide changes, the never-emptied `data/mail`, old emails satisfying the ORD-10 check, and the Manila clock after about 21:15).

The architecture reviewer found the module boundaries holding (no deep imports, no cycles, Order Status written only in `status.ts`) and one real bug: the public menu crashes when a Category slug has no stand-in icon.

The Staff tools reviewer found access control holding on every Manager-only Server Action, including the 8.4 and 8.5 ones. It changed cafe-wide settings to test them and put each back (checked in the database). It left "AUDIT TEST" entities in the dev database because the Staff tools have no delete: two hidden Menu Items, Orders K-018 to K-022 (K-022 counts PHP 175 in that day's sales) and a net-zero Star adjustment, besides the ones from 6 November.

All 16 areas are now reviewed.

On 2026-11-13 a skeptical checker opened the cited code for each of the 135 findings of 2026-11-10 (12 checkers, 9 to 15 findings each). Of the 130 that hold, the adjusted severities are 2 high, 20 medium, 93 low and 15 info (the reviewers had 3 high and 51 medium). The 2 high: the public menu crashes when a Category slug has no stand-in icon, and the two-minute demo is closed outside Manila ordering hours.

The 236 findings of 2026-11-06 were double-checked the same way on 2026-11-13, in four batches: A, the 45 believed fixed by Phases 7 and 8; B, the 41 that repeat a checked 2026-11-10 finding; C, the 35 still open at high or medium; D, the 115 still open at low or info. None was refuted. Of the 133 that still hold on their own, every one is now low (93) or info (40): Phases 7 and 8 fixed or shrank the rest, and the medium and high ones of that day live on through their 2026-11-10 duplicates.

Every finding of the audit now has a verdict, and the merged, ranked backlog is [2026-11-13.md](2026-11-13.md): 205 open items (2 P0, 18 P1, 142 P2, 43 P3). Its P0 and P1 items became roadmap batches 7.7 to 7.11. The interim file stays, as the evidence behind the backlog.

**Still to do**

1. Fix the flaky Playwright run (backlog items tests:4 and tests:5), the last part of batch 7.5.

**Done on 2026-11-13**

1. Merged duplicates and ranked everything into [2026-11-13.md](2026-11-13.md), with the 48 findings fixed by Phases 7 and 8 listed there as closed.

## Using the backlog

- Work the batches in `docs/07-ROADMAP.md` (the rest of 7.5, then 7.7 to 7.11). Each names its backlog items, for example `journeys:1`; the backlog gives the problem, the fix, the effort and where in the code.
- When a batch fixes an item, say so in the batch's "Done" note. Fix P2 items when a batch already touches that code.
- For the full evidence behind an item, open its finding (`area:N` in `findings-2026-11-10.json`, `ORD-04` style ids in `2026-11-06-interim.md`) and its verdict file.

## Running an audit again

The checks ran against a production build on port 3300 and the seeded dev database. Reviewers and checkers only read code and used the running app; they never edited the repo, ran migrations or the test suites (one tests reviewer ran Vitest), or wrote to the database directly.

1. Start Docker Desktop. The `hoshikopi-db` container (port 5434) holds `hoshikopi`, `hoshikopi_test` and `hoshikopi_e2e`. `.env.local` and `.env.test` exist on this computer only (git-ignored); on another computer, follow `docs/06-SETUP.md` sections 3 to 6.
2. Serve a production build on port 3300, and stop it when done (PowerShell):

   ```powershell
   $env:BETTER_AUTH_URL = "http://localhost:3300"; $env:NEXT_PUBLIC_SITE_URL = "http://localhost:3300"
   npx next build
   npx next start -p 3300
   ```

3. Run the quality gates first (`npm run qa`, `npm run test:e2e`) and keep their output for the reviewers. Never run `next build` or the Playwright suite while reviewers use port 3300: both rebuild the `.next` folder the server reads.
4. Run reviewers and checkers in small waves (up to 4 at a time) so a usage limit pauses one wave, not the whole audit. Give each a fresh brief with today's commit and test counts; `workflow.md`'s prompts are out of date.
