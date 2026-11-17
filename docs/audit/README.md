# Hoshikopi audits

> **In plain words:** an audit is a top-to-bottom check of the whole project for bugs, security holes, gaps and things worth improving. This folder holds two. The November 2026 audit is finished and fixed, apart from one owner step and 43 small polish items. The 2026-11-17 deep check found no serious problem and 46 smaller ones, which are the Phase 11 fix batches.
>
> **Who should read it:** the owner deciding what to fix next; a developer picking up a fix batch; anyone running a new audit.
> **Last checked:** 2026-11-17.

## Contents

1. [Status today](#1-status-today)
2. [What P0 to P3 mean](#2-what-p0-to-p3-mean)
3. [The files](#3-the-files)
4. [How the November audit ran](#4-how-the-november-audit-ran)
5. [Using the backlog](#5-using-the-backlog)
6. [Running an audit again](#6-running-an-audit-again)

## 1. Status today

**Start with the ranked list of the audit you need:** [2026-11-17.md](2026-11-17.md) for the deep check, [2026-11-13.md](2026-11-13.md) for the November audit.

| Audit | What it found | Where it stands on 2026-11-17 |
| --- | --- | --- |
| **November 2026 audit** (2026-11-06 to 2026-11-14), ranked in [2026-11-13.md](2026-11-13.md) | 371 findings in 16 areas, merged into 205 open items: 2 P0, 18 P1, 142 P2, 43 P3 (another 48 were already fixed, 16 out of scope, 1 refuted) | **Done**, apart from 44 items: 1 P1, 0 P2, 43 P3. Both P0 and 17 of the 18 P1 were fixed in batches 7.5 to 7.11. All 142 P2 are fixed: 17 in Phases 7 to 9, the other 125 in the 21 batches of Phase 10. |
| **Deep check, 2026-11-17**, in [2026-11-17.md](2026-11-17.md) | 46 findings from six areas, numbered DC-01 to DC-46: 0 P0, 2 P1, 29 P2, 15 P3 | **Open.** Grouped into roadmap batches 11.2 to 11.6, in order of risk. Two GitHub settings only the owner can change are in its section 5. |

What is still open from November:

- **ops:8 (P1), an owner step:** the seeded Event, Promo and Seasonal dates on the live site. Since batch 10.18 the daily job moves them forward by itself; the owner checks the live site and closes the item.
- **43 P3 items:** observations, nits and ideas, listed under "P3 (43)" in [2026-11-13.md](2026-11-13.md). No action is planned for them.

## 2. What P0 to P3 mean

Both audits rank every item on the same four levels.

| Level | In plain words | What to do | Example |
| --- | --- | --- | --- |
| **P0** | Serious: breaks a main flow or the two-minute demo, someone could exploit it, or money or data could be lost | Fix now | The public menu crashed when a Manager added a new Category (fixed in 7.7a) |
| **P1** | A real problem in a main flow: someone gets stuck, an accessibility failure, or a missing safety net | Fix next | The only Manager can delete their own account and lock everyone out of `/manage` (DC-01) |
| **P2** | A smaller bug or gap, often in a rare situation, that will happen sooner or later | Fix soon, or when a batch touches that code | A tablet left on overnight shows yesterday's Sold Out items (DC-13) |
| **P3** | Polish: an observation, a nit or an idea | No action planned; pick it up when nearby | A message promises a reply "within two days" on a demo inbox (DC-36) |

The November files also say high, medium, low and info for P0 to P3: that is the checker's severity behind each level.

## 3. The files

| File | What it holds |
| --- | --- |
| [2026-11-17.md](2026-11-17.md) | **The deep check of 2026-11-17**, in plain words: what was checked, the 46 findings grouped by fix batch with the fix for each, the settings only the owner can change, and what was confirmed sound |
| [2026-11-13.md](2026-11-13.md) | **The November audit's ranked backlog**: the counts, the batches that fixed it (7.5 to 7.11 and 10.1 to 10.21), the open items, and every closed finding |
| [2026-11-06-interim.md](2026-11-06-interim.md) | The 236 findings of 2026-11-06 from 9 areas, with full evidence. Kept as the record behind the backlog. |
| [findings-2026-11-06.json](findings-2026-11-06.json) | The same 236 findings as data |
| [findings-2026-11-10.json](findings-2026-11-10.json) | The 135 findings of 2026-11-10 from the last 7 areas: accessibility 15, customer journeys 23, motion 12, ops and deploy readiness 20, tests 18, architecture and code quality 24, Staff tools 23 |
| [verdicts-2026-11-06.json](verdicts-2026-11-06.json) | A second reviewer's verdict on each of the 236 findings of 2026-11-06: 48 fixed, 41 duplicates of a 2026-11-10 finding, 50 confirmed, 83 partly, 14 out of scope |
| [verdicts-2026-11-10.json](verdicts-2026-11-10.json) | A second reviewer's verdict on each of the 135 findings of 2026-11-10: 69 confirmed, 61 partly, 4 out of scope, 1 refuted, each with its adjusted severity, the problem and fix in plain words, and the duplicates to merge |
| [workflow.md](workflow.md) | The workflow script the first November runs used, kept for a future audit. Its prompts describe the code as of 2026-11-06. |

## 4. How the November audit ran

The November audit looked at the project the way a senior web developer, a security reviewer and a QA tester would. It ran as a Claude Code workflow (a script that runs many Claude agents): specialist reviewers each covered one area, a second reviewer tried to disprove every finding, and a final pass merged and ranked what survived.

1. **2026-11-06:** reviewers covered 9 areas: ordering core, payments, identity and access (2 passes), web security (2 passes), performance, UI (2 passes), the data model, the docs, and product features with competitor research. They saved 236 findings.
2. **The first three workflow runs stopped** (two on Claude usage limits, one when the session ended) before the double-check and ranking. The rest was done in smaller steps.
3. **2026-11-10:** the last 7 areas, one at a time, on `main` at `0aa0462`, after Phases 7 and 8 had already fixed many earlier findings. They saved 135 findings. The quality checks all passed that day: lint, Prettier, the type check, Vitest (228 tests in 39 files), the production build, `npm audit` (0 vulnerabilities) and Playwright (180 passed, 38 skipped on purpose).
   - The ops reviewer read the live demo only (the Vercel and Neon dashboards were out of reach) and found its server code in Singapore (`sin1`).
   - The tests reviewer changed code on purpose to see if the tests noticed. The race tests caught removed locks, but a Prep Time that ignored the bar's queue and a Refund that took Stars below zero passed every test. Both now have tests.
   - The Staff tools reviewer left "AUDIT TEST" records in the local dev database, because Staff tools had no delete then: two Hidden Menu Items, Orders K-018 to K-022 and a net-zero Star adjustment.
4. **2026-11-13:** a skeptical checker opened the cited code for every one of the 371 findings and gave a verdict. Of the 2026-11-10 findings that held, 2 were high, 20 medium, 93 low and 15 info. Of the 2026-11-06 findings that still held on their own, all were low (93) or info (40); none was refuted. Duplicates were merged and everything was ranked into [2026-11-13.md](2026-11-13.md).
5. **2026-11-14 to 2026-11-17:** the P0 and P1 items became batches 7.7 to 7.11, a first P2 sweep was 7.12, and the remaining 125 P2 items became Phase 10.

The 2026-11-17 deep check ran differently: automatic checks first (tests, security advisories, a secrets scan, the live site's headers), then six reviewers each read one area, and every finding was checked against the code a second time. Its section 1 has the details.

## 5. Using the backlog

- **Fix work is planned as roadmap batches** in [docs/07-ROADMAP.md](../07-ROADMAP.md). Each batch names its items: `DC-12` style ids for the deep check, `journeys:1` style ids for November.
- **For the deep check,** work batches 11.2 to 11.6 in order, one branch and pull request each, after the owner approves. Each row in [2026-11-17.md](2026-11-17.md) gives what goes wrong, where in the code, and the fix.
- **For the November P3 items,** fix one only when a batch already touches that code.
- **When a batch fixes an item,** say so in the batch's "Done" note in the roadmap.
- **For the full evidence behind a November item,** open its finding and its verdict. An `area:N` id is the Nth finding of that area in `findings-2026-11-10.json`, with its verdict in `verdicts-2026-11-10.json`. An `ORD-04` style id is in `2026-11-06-interim.md`, with its verdict in `verdicts-2026-11-06.json`.

## 6. Running an audit again

The November checks ran against a production build on port 3300 and the seeded local dev database. Reviewers and checkers only read the code and used the running app. They never edited the repository, ran migrations (scripts that change the database's shape) or the test suites, or wrote to the database directly (one tests reviewer ran Vitest).

1. **Start Docker Desktop.** The `hoshikopi-db` container (port 5434) holds the `hoshikopi`, `hoshikopi_test` and `hoshikopi_e2e` databases. `.env.local` and `.env.test` exist only on a computer already set up (git ignores them); on another computer, follow [docs/06-SETUP.md](../06-SETUP.md) sections 3 to 6.
2. **Serve a production build on port 3300,** and stop it when you are done (PowerShell):

   ```powershell
   $env:BETTER_AUTH_URL = "http://localhost:3300"; $env:NEXT_PUBLIC_SITE_URL = "http://localhost:3300"
   npx next build
   npx next start -p 3300
   ```

3. **Run the quality checks first** (`npm run qa`, `npm run test:e2e`) and keep their output for the reviewers. Never run `next build` or the Playwright tests while reviewers use port 3300: both rebuild the `.next` folder that server reads.
4. **Run reviewers and checkers in small waves,** up to 4 at a time, so a usage limit pauses one wave, not the whole audit. Give each a fresh brief with today's commit and test counts; the prompts in `workflow.md` are out of date.
5. **Have a second reviewer check every finding** against the code before it is written down, then merge duplicates and rank what is left from P0 to P3.
