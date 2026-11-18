# Launch readiness: from demo to a real cafe

> **In plain words:** Hoshikopi is finished as a demo. This page says how far it is from running a real cafe, judged the way a professional would before a launch: what is strong, what is missing, what a real launch would test, and what to set up before taking real money. It ends with a suggested order. Nothing here is scheduled; it is ready for the day someone decides to go further.
>
> **Who should read it:** the owner, before deciding to run Hoshikopi for real; a developer or project manager planning that work.
> **Last checked:** 2026-11-18, after Phase 13.

## Contents

1. [Where it stands](#1-where-it-stands)
2. [Scorecard](#2-scorecard)
3. [What a real launch would test](#3-what-a-real-launch-would-test)
4. [Before taking real money](#4-before-taking-real-money)
5. [A suggested order](#5-a-suggested-order)
6. [Where to go next](#6-where-to-go-next)

## 1. Where it stands

**In short:** about 75% of the way to a real single-cafe launch. Most of what is left is not code: accounts, paid plans, monitoring, legal work and real-world testing.

| As a... | Where it stands |
| --- | --- |
| Portfolio and demo | **Done.** The whole loop works: order ahead, Test Mode payment, Stars, the Bar Screen and the staff tools. Two full audits, with every finding fixed or decided. 573 unit and database tests and 259 browser tests pass. |
| A pilot at one real cafe, with invited customers | **Close.** It needs a payment account, an email domain, paid plans and monitoring: weeks of setup, not a rebuild. |
| A public launch | **Not yet.** It needs the legal work, cross-browser and load testing, and trials with real people (sections 3 and 4). |

## 2. Scorecard

| Area | Rating | Why |
| --- | --- | --- |
| Features for one cafe | Strong | Menu, Options, Pickup Windows with Capacity, checkout, a live Order page, the Bar Screen, Refunds, Stars, Events, Posts and Reports all work together. |
| Code and design of the code | Strong | Modules with enforced boundaries; money in whole centavos; the server prices everything; Order Status changes in one place; 15 decisions recorded as ADRs. |
| Automated testing | Strong, one gap | The money, Capacity, Stars and payment rules were built test-first. The browser tests check accessibility, and CI runs on every pull request. **Gap:** the browser tests use Chrome only. |
| Security | Good | Staff use a Second Factor; payment messages are verified; public forms have rate limits; CSP and HSTS are on; Order links are secret; sign-in redirects stay on the site. **Gaps:** no outside penetration test; the CSP allows inline scripts, a known trade-off (ADR 0013). |
| Accessibility | Good | No automated violations and Lighthouse Accessibility 100. **Gap:** no full manual audit with screen-reader users. |
| Speed | Good | Lighthouse 90 to 94. Home and `/menu` meet the budget; a Menu Item page is about 35 ms over it, the framework's own start-up. Never tested under load. |
| Operations | Weak | Vercel keeps logs for 1 hour. There are no error alerts and no uptime checks. Neon's free plan restores only the last 6 hours. |
| Real payments | Gap | Only the built-in `fake` provider has ever run. The PayMongo connector is built and unit-tested, but has never talked to PayMongo, even in Test Mode. |
| Legal and business | Not started | Fine for a concept; a real cafe needs section 4. |

## 3. What a real launch would test

None of these has been done yet. Tick each one when it is.

- [ ] **Other browsers and real phones.** The browser tests run in Chromium only, and many customers use Safari on an iPhone. The phone menu uses the browser's popover feature, which needs Safari 17 or newer, so on older iPhones the menu button would do nothing.
  - Add WebKit (Safari's engine) and Firefox projects to `playwright.config.ts`.
  - Give the phone menu a fallback for browsers without popovers.
  - Try the site on a real iPhone and a real Android phone.
- [ ] **Load at the morning rush.** For example, 50 to 100 people ordering at once, with several Bar Screens open, each asking for news every 3 seconds. Capacity locking is proven correct, but not timed under load. Watch Neon's compute use during the test: the free plan stops when its monthly allowance runs out.
- [ ] **Real payments, end to end, in Test Mode.** A PayMongo account and test keys; real webhooks arriving, repeated and late; refunds through PayMongo; and checking that the site's records match PayMongo's.
- [ ] **A penetration test.** An outside security firm tries to break in. The two internal audits are thorough, but customers and payment companies expect an independent one.
- [ ] **Trials with real people.**
  - Baristas on a real tablet during a rush, with no receipt printer.
  - Customers ordering on their own phones.
  - A Manager running `/manage` for a week.
- [ ] **Failure drills.** What happens, and what staff do, when the database is down, Vercel is down, the payment company is slow, or the cafe's Wi-Fi drops during service.
- [ ] **A manual accessibility audit** by a specialist, with VoiceOver, TalkBack and keyboard-only use.

## 4. Before taking real money

Mostly setup and paperwork, not code. Tick each one when it is.

**Services and plans**

- [ ] **Vercel Pro.** The free Hobby plan is for personal, non-commercial use only.
- [ ] **A paid Neon plan,** for longer backups and more compute.
- [ ] **A domain, then Resend,** so sign-in links and Order emails reach any customer ([docs/06-SETUP.md](06-SETUP.md) section 9).
- [ ] **A PayMongo account with live keys.** The site refuses live keys on purpose, so this needs a new ADR that replaces [ADR 0003](adr/0003-payments-paymongo-test-mode.md), and a decision to drop the Concept Notice ([ADR 0006](adr/0006-concept-project-no-real-money.md)).
- [ ] **Error monitoring and uptime alerts,** such as Sentry and an uptime check, and a simple plan for who answers them.

**Legal and business (the Philippines)**

- [ ] Business registration.
- [ ] Official receipts and invoices from the tax office (BIR).
- [ ] The Internet Transactions Act (RA 11967), the rules for online sellers.
- [ ] The Data Privacy Act (RA 10173): the privacy notice already exists at `/privacy`; check whether registering with the National Privacy Commission is needed.
- [ ] The senior citizen and PWD (person with disability) discount (RA 9994, RA 10754, JMC 01-2022).
- [ ] Terms of service.

**Content**

- [ ] Real photos of the room and the drinks, real Staff accounts, and the cafe's real details in `/manage/cafe`.

## 5. A suggested order

1. **Browsers.** WebKit and Firefox in the browser tests, and a fallback so the phone menu works on older iPhones. This is the only code step; one small batch.
2. **Real payments in Test Mode.** A PayMongo account, test keys, and the end-to-end run in section 3.
3. **Plans and monitoring.** Vercel Pro, a paid Neon plan, a domain and Resend, error alerts and an uptime check.
4. **A pilot.** Invited customers for a few weeks: the real-people trials, load and failure drills in section 3.
5. **Launch.** The legal work in section 4, a penetration test, then live keys through a new ADR.

## 6. Where to go next

- What is scheduled now: the [roadmap](07-ROADMAP.md), section 0.
- The latest full check: [docs/audit/2026-11-18.md](audit/2026-11-18.md).
- Every other document: the [docs map](README.md).
