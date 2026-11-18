# Success metrics, measured

> **In plain words:** At the start, the project set five measurable targets: how fast an order is, how fast and accessible the pages are, how well the rules are tested, a two-minute demo, and a written case study. This file shows how each was measured on 2026-11-14 and what came out. All five are met; the speed target is met on the live site (the local build scores Home 89, one point short).
>
> **Who should read it:** the owner or a reviewer who asks "is it actually fast and well tested?"; a developer who wants to repeat a measurement.
> **Last checked:** 2026-11-17. The numbers themselves are from 2026-11-14. Later batches changed the code, so measure again before quoting them as current.

The five portfolio targets in [`docs/01-PRD.md`](01-PRD.md) section 8, measured on 2026-11-14 (roadmap 9.1). Everything here runs on the Windows 11 PC described in [`docs/08-TOOLING.md`](08-TOOLING.md). Live-site numbers are marked as live.

Words used below: Lighthouse is Google's free tool that scores a page out of 100. A median is the middle result of several runs, so one odd run does not skew it. Playwright is a tool that drives a real browser the way a person would, to test the whole site (an "e2e", or end-to-end, test). Vitest is the tool that runs the code-level tests. axe is a free tool that finds accessibility mistakes in a page. A production build is the site built the way it is deployed, as opposed to the slower development version.

## Summary

This table has one row per target: what was promised, what was measured and whether it was met. "See" means the target was a document, and the section named says where it is.

| # | Target | Result | Met |
| --- | --- | --- | --- |
| 1 | End-to-end order under 60 s on a throttled phone | 8.7, 8.9 and 9.1 s, menu to Paid | Yes |
| 2 | Mobile Lighthouse Performance 90+ on Home and `/menu` | Live: 100 on both (PageSpeed Insights, mobile). Local medians: Home 89, `/menu` 91 | Yes, on the live site |
| 2 | Zero axe violations on every page | 0 in the full e2e run, both palettes, 375 and 1280 px | Yes |
| 3 | Every price, Reward, Capacity and Order Status rule covered by a test that fails without it | 7 of 7 rule mutations caught (6 of 7 before one test was widened) | Yes |
| 4 | A two-minute demo script | Every step runs in the e2e suite; the written script is [`docs/DEMO-SCRIPT.md`](DEMO-SCRIPT.md) (9.3) | Script done; the owner's spoken run on the live site is the last check |
| 5 | A case study with the decisions and the numbers | [`docs/CASE-STUDY.md`](CASE-STUDY.md), 9.2 | Yes |

## 1. An order on a throttled phone

This measures how fast a Guest can order and pay. The target is under 60 seconds; a slowed-down phone profile does it in about 9.

`tests/e2e/quality.spec.ts`, "a Guest orders and pays end to end in under 60 s on a throttled phone". It runs at 375 px, with Chrome slowed like Lighthouse's mobile run (4x CPU, 150 ms round trip, 1.6 Mbps down, 750 kbps up). It goes from a Menu Item page to Add to order, checkout, GCash and the Test Mode checkout. Then it waits for "Paid online (Test Mode)." on the Order page. It runs against the production build the e2e suite uses.

Three runs on their own took **8.7, 8.9 and 9.1 seconds**. Inside the full suite, with three other workers competing for the CPU, it took 16.5 s. A script types instantly, so a person takes longer. The test fails above 60 s, so it now guards the target in every run.

## 2. Lighthouse and axe

This measures how fast the pages load and how accessible they are, with two free tools. Lighthouse scores speed and quality; axe finds accessibility mistakes (the standard is WCAG 2.2 AA, the international web accessibility standard). Terms in the table: LCP (largest contentful paint) is how long until the biggest thing on screen appears; total blocking time is how long the page is too busy to respond to a tap; CLS (cumulative layout shift) is how much the page jumps around while loading, where 0 means not at all.

**Lighthouse 12.8.2, mobile, 3 runs per page, medians,** on a local production build (`next build`, `next start` on port 3300, dev database), the same method as 7.6:

| Page | Performance | Accessibility | LCP | Total blocking time | CLS |
| --- | --- | --- | --- | --- | --- |
| Home | 89 (85, 89, 89) | 100 | 3.28 s | 203 ms | 0.001 |
| `/menu` | 91 (91, 93, 89) | 100 | 3.20 s | 121 ms | 0 |
| A Menu Item | 91 (88, 91, 91) | 100 | 3.07 s | 189 ms | 0.003 |

- **Home is 1 point under 90 locally**, down from 93 on 2026-11-08 (7.6). Total blocking time is the part that moved (113 to 203 ms). Since then the site gained the focus helpers (7.8a) and the Bar Screen and checkout changes. Runs on one PC also swing a few points with background load (85 to 89 for Home here).
- **LCP reads about 3 s locally on every page.** On localhost the scripts arrive before the first paint and Lighthouse's simulation charges them to it (7.6). The live site measured 1.7 to 2.5 s before 7.6, so LCP is judged there.
- **The live site scores higher.** On 2026-11-14 PageSpeed Insights (pagespeed.web.dev, run by the owner) gave Home and `/menu` 100 for Performance, Accessibility and Best Practices, on mobile and on desktop. One Lighthouse 12.8.2 mobile run from the PC against the live site, the same day, gave Home 97 (LCP 2.3 s, total blocking time 120 ms) and `/menu` 94 (LCP 2.4 s, 200 ms). So LCP is under 2.5 s live.
- **SEO scores 60 on purpose.** Its one failing check is "Page is blocked from indexing": every page asks search engines not to list it (`robots: { index: false, follow: false }` in `src/app/layout.tsx`, since 8.2), so an invented cafe never shows up in search as a real one (ADR 0006). Every other SEO check passes.

**axe** (`@axe-core/playwright`, WCAG 2.0, 2.1 and 2.2 A and AA tags) runs at 37 places in 17 specs, many in both palettes. Every spec runs at 375 and 1280 px. The last full run reported **0 violations**. Lighthouse's own accessibility score is 100 on all three pages.

## 3. Rules that fail their tests when broken

This checks that the tests are real. A test that never fails proves nothing, so we broke seven rules on purpose, one line each, and checked that the test suite noticed.

A rule counts as covered if breaking it makes the Vitest suite fail. Each mutation below changed one line, then the script ran Vitest and put the line back.

| Rule | The break | Caught |
| --- | --- | --- |
| A Price Delta is added to a Line (ADR 0002) | `pricing.ts`: drop the Options from `addMoney` | Yes |
| A Reward takes the Base Price off | `place.ts`: total ignores the Reward Line | Yes |
| Capacity counts this Order's drinks (ADR 0007) | `place.ts`: lock check without `need.drinks` | Yes |
| Picked Up only from Ready | `status.ts`: also from Preparing | **No**, then yes |
| A Reward drink earns no Star (LOY-01) | `status.ts`: earn counts Reward Lines | Yes |
| Prep Time rounds up to 5 minutes | `ordering-day.ts`: round to 1 minute | Yes |
| Prices show their centavos (ADR 0002) | `money.ts`: drop the fraction | Yes |

The one miss was real. The test refused skipping a step only from Placed. It now tries every skip from every step on the bar path, and the mutation fails it (`tests/db/order-status.test.ts`). This is a sample of 7, not a full mutation run. The rules built test-first (money, Capacity, Prep Time, Stars, Order Status, webhooks) were each written to fail first, as `CLAUDE.md` asks.

**Suite size:** Vitest has 256 tests in 41 files and runs against a real Postgres test database. Playwright has 233 tests across the phone, desktop and cafe-wide projects. The last full run had 191 passed, 0 failed and 42 skipped by design: a check that runs at one size skips at the other.

## 4. The demo, step by step

The two-minute demo is how a reviewer sees the whole product. Each step is already a passing automated test, so the demo cannot silently break.

The PRD's demo is: order as a Guest, pay in the Test Mode checkout, watch the Order move on the Bar Screen, collect a Star as a Member. Each step is an e2e test that passes:

- Order and pay: `payments.spec.ts` (and metric 1 above).
- The Bar Screen moves it and the Order page follows: `bar.spec.ts`, Phase 2 exit.
- Stars as a Member, through to a free drink: `stars.spec.ts`, Phase 4 exit.
- A visitor alone plays the barista (Demo Mode, ADR 0015): `order-status.spec.ts`.

The hosted demo takes Orders all day (7.7b), so a reviewer in any time zone can run it. The written script is [`docs/DEMO-SCRIPT.md`](DEMO-SCRIPT.md) (9.3, done 2026-11-14); the spoken run on the live site is the owner's last check.

## Where to go next

- How the project was built and why: [docs/CASE-STUDY.md](CASE-STUDY.md).
- Show it to someone: [docs/DEMO-SCRIPT.md](DEMO-SCRIPT.md).
- Every other document: the [docs map](README.md).
