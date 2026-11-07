# Audit workflow script

The Claude Code workflow that finishes the audit ([README.md](README.md)). Pass the script to the Workflow tool (inline, or save it outside the repo as a `.js` file and use `scriptPath`), with these arguments:

| Argument | Value |
| --- | --- |
| `repo` | Absolute path of this repository |
| `url` | `http://localhost:3300`, the production build the reviewers use |
| `gates` | Folder holding the saved quality gate output: `lint.log`, `format:check.log`, `typecheck.log`, `test.log`, `build.log`, `audit.log`, `audit-all.log`, `outdated.log`, `e2e.log` |
| `scratch` | A folder outside the repo for the reviewers' scripts and screenshots |
| `serverLog` | The log file of the server on port 3300 (sign-in links appear there) |
| `mailDir` | `<repo>/data/mail` |
| `today`, `manilaTime` | The date, and the time in Manila (the cafe is open 7:00 to 21:00) |
| `priorPath` | `<repo>/docs/audit/findings-2026-11-06.json` |
| `prior` | One entry per area in that file: `{ key, count, passes, summary }`, where `count` is the number of findings and `summary` the joined `summaries` |
| `todo` | Areas still to review: `["a11y", "architecture", "tests", "ops", "staff", "journeys", "motion"]` (an empty list only verifies and ranks the saved findings) |

It returns `synth` (summary, scorecard, ranked items P0 to P3, quick wins, suggested order, strengths), `kept`, `dropped` and per-area stats; the final report is written from `synth`.

```js
export const meta = {
export const meta = {
  name: 'hoshikopi-audit-continue',
  description: 'Finish the Hoshikopi audit: review the remaining areas, verify those findings and the saved ones in batches, rank the backlog',
  phases: [
    { title: 'Find', detail: '16 specialist auditors: senior dev, security, QA, UI, a11y, product' },
    { title: 'Verify', detail: 'one skeptic per batch of up to 10 findings tries to refute each' },
    { title: 'Synthesize', detail: 'dedupe, rank and group into a prioritized backlog' },
  ],
}

const A = args
const PRE = (key) => `You are one specialist in a team auditing the Hoshikopi repository at ${A.repo}.
Hoshikopi is a concept cafe website (Next.js 16 with Cache Components, React 19, TypeScript, Prisma 7 on Postgres, Better Auth, Tailwind 4). The CLAUDE.md rules are already in your context. Phases 0 to 6 of docs/07-ROADMAP.md are built; batch 5.4 (demo deploy on Vercel + Neon) and Phase 7 are still open. Today is ${A.today}; it is about ${A.manilaTime} in Manila, so the cafe (open 7:00 to 21:00, last order 20:30) is open now.

Ground truth you can use:
- Quality gate outputs are saved in ${A.gates}: lint.log, format:check.log, typecheck.log, test.log (vitest, 193 tests passed), build.log (route table), audit.log (npm audit --omit=dev: 0 vulnerabilities), audit-all.log (all deps, exit 1), outdated.log, e2e.log (Playwright: 159 passed, 35 skipped). All gates passed.
- A production build is served at ${A.url} against the seeded dev database (Postgres in Docker, 127.0.0.1:5434, database "hoshikopi", user postgres, password dev). Seeded accounts: Manager christian@hoshikopi.example, Barista annika@hoshikopi.example, Member hoshi@hoshikopi.example. Sign-in is by email link; the link is written to ${A.mailDir} (newest file) and to the server log ${A.serverLog}. Playwright and Chromium are installed (node_modules/@playwright/test, @axe-core/playwright). Chrome is installed for Lighthouse (npx lighthouse).
- Bundled Next.js 16 docs are in ${A.repo}/node_modules/next/dist/docs/ (Cache Components is newer than most training data; read before judging Next API use).

Hard rules:
- Do NOT modify, create or delete any file inside the repo. Do not commit. Write scratch scripts, screenshots and notes only under ${A.scratch}/${key}/.
- Do not stop or restart the server, Docker or the database. Do not run migrations, db:reset or seed against the dev database.
- Do not run the vitest or Playwright suites yourself (one shared test database and port); read the logs instead. (Exception: the tests auditor.)
- Other auditors share the running app: never toggle Ordering Paused, Opening or Special Hours, Capacity, Prep Time or Sold Out, and never edit seeded content. Only touch Orders, Carts and test entities you created yourself.
- Every finding needs concrete evidence: file:line with a short quote, command output, or an observed behaviour with exact steps. Mark anything you could not confirm with low confidence. Prefer real, specific findings over generic advice, but be thorough: cover every file in your scope and say in "coverage" what you actually examined.
- Respect recorded decisions: check docs/adr/ before flagging a deliberate choice. If you still disagree with an ADR, report it as kind "improvement" and cite the ADR number.
- Concept project: no real money moves (ADR 0006) and payments run in Test Mode, but the PRD says to build it as if real, so judge security and correctness as production code.
- Severity: critical = auth bypass, data loss, money or Star integrity broken, remotely exploitable; high = real bug in a core flow or a clearly exploitable weakness; medium = edge-case bug, notable inefficiency, WCAG 2.2 AA failure; low = minor issue; info = observation or nit. For kind "feature" or "improvement", severity means value: high = strong value for this product.
- Kinds: bug, security, inconsistency, inefficiency, gap (missing behaviour the docs promise), test-gap, docs, improvement, feature.`

const DIMS = [
  { key: 'ordering', title: 'Ordering core: Cart, pricing, placement, Capacity, Pickup Windows, Prep Time, Order Status (senior dev + QA)',
    brief: `Scope: src/modules/cart, src/modules/ordering, src/modules/cafe, src/modules/menu/internal/pricing.ts, src/modules/loyalty (as used at placement), src/lib/money.ts, clock.ts, hours.ts, src/app/(site)/cart, checkout, orders, src/app/api/orders, the matching parts of prisma/schema.prisma, and docs/03-ARCHITECTURE.md sections 5 to 10, docs/04-DATA-MODEL.md, ADR 0002, 0007, 0008.
Check hard: the server prices everything and ignores client totals (ORD-06); names, Options and prices are snapshotted at placement; Order Status changes ONLY through transition() and the section 7 table (grep for any direct status writes); Capacity is checked under a row lock in placeOrder and released in the same transaction on Cancel/Expire/Refund; reserved Stars are released likewise; idempotency on double submit; Manila day boundaries, Special Hours, last order cutoff, Pickup Window math, Prep Time; promos (6.3) time-boxed prices applied at placement; Sold Out or Hidden items between cart and checkout; Option Group rules (required, min/max); quantity bounds; integer centavos everywhere; race conditions between concurrent placements; guest vs member carts and merge.` },
  { key: 'payments', title: 'Payments, webhooks, expiry and refunds (security)',
    brief: `Scope: src/modules/payments, src/modules/ordering/internal/webhook.ts and refund.ts, src/app/api/webhooks/[provider], src/app/(site)/dev/pay, the checkout return page, src/app/api/cron/daily (expiry), tests/db/payments.test.ts and refunds.test.ts, ADR 0003 and 0006, docs/03-ARCHITECTURE.md section 8. You may read PayMongo docs on the web (docs.paymongo.com, webhook signature format).
Check: signature verification (correct HMAC input, timing-safe compare, timestamp tolerance and replay window, test vs live signature field); raw body used; dedupe on provider event id with a DB unique constraint; amount and currency checked against the Order total; checkout session bound to the right Order; the return URL never decides payment state; sk_live_ refused; fake provider refuses production domains and /dev/pay cannot be used to mark Orders paid in production; late webhook after Expiry; webhooks for unknown Orders; refund idempotency; error responses or logs leaking secrets.` },
  { key: 'identity', title: 'Identity, authentication and access control (security)',
    brief: `Scope: src/modules/identity, src/app/api/auth, src/app/(site)/sign-in, src/app/(site)/account and src/app/api/account/export, src/app/manage (every page and server action), src/app/bar and src/app/api/bar, src/app/manage/two-factor, any proxy/middleware file, the Order access token used by /orders/[id] and /api/orders/[id]/status, ADR 0005 and 0014, docs/03-ARCHITECTURE.md section 13.
Check: every Staff server action re-checks the role server side (not only the layout); Barista vs Manager permissions; the Second Factor cannot be skipped by calling actions or routes directly; email link expiry and single use; email enumeration; sign-in rate limits; session cookie flags; CSRF/origin checks on route handlers; Order access token entropy, timing-safe comparison, exposure in URLs, logs or Referer; IDOR in export, favourites, orders, account pages; account deletion completeness; Google OAuth config; trusted origins; audit() coverage of Staff actions. Try real requests against ${A.url} where useful (signed out, as Member, as Barista).` },
  { key: 'websec', title: 'Web security surface: headers, CSP, input handling, uploads, cron, dependencies (security)',
    brief: `Scope: next.config.ts (headers, CSP; ADR 0013), any proxy/middleware, src/lib/rate-limit.ts, every route handler under src/app/api and every server action file, zod validation coverage, react-markdown rendering (raw HTML, javascript: links, images), the calendar/ICS generator (src/modules/content/internal/calendar.ts), Inquiries and Event Sign-ups, notify templates (HTML/header injection), photo upload (src/modules/menu/internal/photo.ts: type, size, path traversal, SVG), cron auth (CRON_SECRET comparison), opengraph image routes, open redirects (sign-in callback), error pages, vercel.json, ${A.gates}/audit-all.log and outdated.log.
Use OWASP Top 10 2021 and ASVS L2 as your checklist; the "security-review" skill's checklist may help (load it with the Skill tool). Probe ${A.url} with curl for headers, CSP, cookie flags, method handling, oversized bodies, and the cron/bar/webhook endpoints unauthenticated.` },
  { key: 'performance', title: 'Performance and Next.js 16 Cache Components (senior dev)',
    brief: `Scope: how pages use "use cache", cacheTag/cacheLife and revalidateTag/updateTag (tags menu, hours, content; read the bundled docs first), the route table in ${A.gates}/build.log, client components ("use client" files), images (next/image, sizes, formats, the menu photos), fonts, the polling endpoints (/api/bar, /api/orders/[id]/status: payload size, caching headers, frequency; ADR 0009), database query efficiency (N+1, over-fetching, missing indexes vs prisma/schema.prisma), and the budgets in docs/05-DESIGN-SYSTEM.md section 11.
Measure: run Lighthouse mobile (npx lighthouse ${A.url}/... --only-categories=performance,accessibility,best-practices,seo --output=json --quiet --chrome-flags="--headless=new") on /, /menu, /menu/item/hoshi-latte, /cafe and /events; record scores, LCP, CLS, TBT and the biggest opportunities. Note that the server is a local production build.` },
  { key: 'ui', title: 'UI and visual design review (senior UI/UX)',
    brief: `First load the "design-taste-frontend" skill and the "ui-ux-pro-max" skill with the Skill tool and use them as your review lens (audit mode: review, do not build). Read docs/05-DESIGN-SYSTEM.md (owner's brief: very modern and aesthetic; Flora Cafe reference; Day and Night wireframes in section 1.2), ADR 0010 (theme follows Manila time), 0011 (native elements and CSS), 0012 (concept images with stand-ins).
Take screenshots with a Playwright script of the key pages (/, /menu, a Category, /menu/item/hoshi-latte, /cart, /checkout, /orders/[id] for an order you place, /cafe, /events, an Event, /news, a Post, /account/stars, /sign-in, a 404) at 375 and 1280 px, in both the day and night palettes (find how the theme is chosen or overridden), save them under your scratch folder and look at them with the Read tool. Judge hierarchy, typography, spacing rhythm, colour use (one accent, gold for stars only), imagery and stand-ins, empty/loading/error states, mobile thumb reach and the Cart, the Concept Notice on every page and at checkout, and copy voice (CLAUDE.md Voice; grep src for em dashes and en dashes in UI strings). Report concrete UI defects and the highest-value visual improvements.` },
  { key: 'a11y', title: 'Accessibility, WCAG 2.2 AA (QA)',
    brief: `Run axe-core (@axe-core/playwright, tags wcag2a, wcag2aa, wcag21aa, wcag22aa) on every public route and on /bar (sign in as Barista Annika) at 375 and 1280 px in both the day and night palettes. Do a keyboard-only walkthrough: menu, Menu Item with Option Groups, add to Cart, Cart edit, checkout, status page. Check focus visibility and order, the skip link, focus not obscured by sticky elements (2.4.11), target size (2.5.8), live regions for price, Cart and Order Status, error association on forms, headings and landmarks, lang, reduced motion, 200 percent zoom and 320 px reflow, contrast in both themes (including disabled and placeholder text). Review tests/e2e/axe.ts and which pages the e2e suite really covers, and why 35 e2e tests were skipped (${A.gates}/e2e.log, tests/e2e). The "apple-design" skill has guidance on reduced motion if needed.` },
  { key: 'architecture', title: 'Architecture and code quality (senior dev)',
    brief: `Load the "codebase-design" skill (deep modules, seams) and the "ponytail:ponytail-audit" skill (over-engineering, dead code, stdlib/native replacements) with the Skill tool and apply them to src/. Check: module boundaries (modules import each other only through index.ts; see tests/module-boundary.test.ts and eslint.config.mjs), shallow or leaky modules, duplication across pages and components, server/client split ("use client" only for leaf components with state or browser APIs), error handling and result types consistency, logging, TypeScript strictness (any, as casts, non-null assertions, ts-ignore), zod validation patterns, naming against GLOSSARY.md, dead exports and unused files, oversized files. Give concrete refactors with locations and the benefit.` },
  { key: 'data', title: 'Data model, migrations and seed',
    brief: `Scope: prisma/schema.prisma, every migration in prisma/migrations, prisma/seed.ts, prisma.config.ts, src/lib/db.ts, against docs/04-DATA-MODEL.md. Check CHECK and unique constraints promised in section 4, foreign key onDelete behaviour (account deletion vs Order snapshots, Stars ledger, Favourites, Sign-ups), indexes for hot paths (orders by status/window, bar polling, reports), integer centavos types, timestamptz vs timestamp, enums vs strings, data retention for PII (Inquiries, Sign-ups, emails in outbox), migration safety, seed idempotency, schema drift between migrations and schema. You may inspect the dev database read-only with psql (docker exec hoshikopi-db psql -U postgres -d hoshikopi), and you may create a scratch database named hoshikopi_audit_scratch for a shadow database if you need prisma migrate diff; drop it when done. Never write to hoshikopi, hoshikopi_test or hoshikopi_e2e.` },
  { key: 'tests', title: 'Tests and QA coverage (QA lead)',
    brief: `You are the only auditor allowed to run vitest (it uses the hoshikopi_test database; never the e2e suite). Read ${A.gates}/test.log and e2e.log (35 skipped: find out why and whether that hides coverage). Map the PRD requirement IDs in docs/01-PRD.md and the "rules code cannot tell you" in CLAUDE.md to tests under tests/db, src/**/*.test.ts and tests/e2e; list critical paths with no test (money, Capacity, Prep Time, Stars, Order Status, webhooks are required test-first). Judge test quality: real assertions, real database, time freezing via lib/clock, negative and race cases. Re-run a few database test files 3 times to look for flakiness (npx vitest run tests/db/<file>). Note the pg "client.query() when the client is already executing a query" deprecation warnings in test.log and find their source. Check whether CI exists (.github/workflows) and what it runs.` },
  { key: 'docs', title: 'Documentation and consistency',
    brief: `Compare CLAUDE.md, AGENTS.md, README.md, GLOSSARY.md, docs/01 to 08, docs/ASSETS.md and every ADR against the code and against each other. Look for stale statements (GitHub status, design direction and the Day/Night decision, roadmap checkboxes vs code, the dropped Filipino batch, commands that do not exist such as npm run perf, env vars documented vs used: grep process.env in src), requirement IDs whose status is wrong, glossary words missing or used inconsistently in code and UI, setup steps that no longer work on a fresh machine (the audit lead had to create .env.local, .env.test, the Docker container and both test databases by hand), broken links and paths in docs. Report each inconsistency with both locations.` },
  { key: 'product', title: 'Product features and competitive research (product + UX)',
    brief: `Read docs/01-PRD.md (scope, V1, out of scope), docs/02-RESEARCH-CAFES.md and the roadmap, and browse ${A.url}. Then research modern cafe and coffee-ordering websites and apps on the web (WebSearch and WebFetch; for example Blue Bottle, % Arabica, Starbucks PH, Pickup Coffee, Single O, Sightglass, Kurasu, Flora Cafe, Tim Wendelboe, Bo's Coffee, Yardstick) for features and UX patterns: order-ahead flow, wait-time transparency, loyalty and gifting, gift cards, subscriptions, group orders, saved orders, menu storytelling and origin info, allergens, reservations, catering, merch, events, PWA, social proof. Propose features and UX improvements Hoshikopi does not have yet that fit a portfolio concept cafe in Metro Manila. Respect the owner's decisions (ADR 0006 no real money, ADR 0011 native elements first, the Filipino language batch was dropped). For each: value, effort, where it fits in the roadmap, and source URLs in refs. Also report anything in the running site that feels unfinished compared with these competitors.` },
  { key: 'motion', title: 'Motion and animation performance',
    brief: `Load the "motion" skill and the "apple-design" skill with the Skill tool and use their animation and reduced-motion guidance (the Motion+ MCP server is not signed in, so do not wait for MotionScore; grade with your own reasoning and say so). Audit every animation and transition in src (CSS transitions and keyframes, View Transitions, the Star Card fill, the Ready step, theme switching, the Order-ready chime/vibrate/notify of batch 6.4, any scroll effects): what property animates (transform and opacity only, or layout-triggering ones), duration and easing, jank and layout-thrash risks (measure with a Playwright performance trace or the Performance API against ${A.url} where useful), prefers-reduced-motion compliance, and alignment with docs/05-DESIGN-SYSTEM.md section 7 (calm motion, CSS first, 150 to 250 ms, nothing animates while choosing Options or paying). An empty findings list must mean "audited and clean", so state in coverage what you examined.` },
  { key: 'ops', title: 'Operations and deploy readiness (batch 5.4)',
    brief: `Scope: vercel.json (crons), next.config.ts, src/lib/db.ts and the Prisma adapter on serverless, env handling (missing secrets fail closed? startup validation?), in-memory state that breaks on serverless (rate limits, caches, the email outbox), email delivery failure handling and retries, cron idempotency and auth, Neon pooled vs direct URLs, server time zone assumptions (Vercel runs UTC), logging and PII in logs, missing error monitoring, backups, image storage for Vercel Blob (remotePatterns), /dev/pay and the fake provider in production, health checks, Node/engine pinning, CI and Dependabot, the "Next.js ignored package-lock.json outside the repo" warning in ${A.serverLog} (outputFileTracingRoot), and docs/06-SETUP.md section 9 if present. Report what would break or be unsafe on the first real deploy.` },
  { key: 'staff', title: 'Staff tools QA: /manage and the Bar Screen (QA)',
    brief: `Review and exercise the Manager and Barista tools: menu editor (Categories, Menu Items, Option Groups, Options, Price Deltas, photos, Hidden, Sold Out, cache tag revalidation), hours and Special Hours, Capacity and Prep Time, Ordering Paused, orders list and refunds, Star adjustments, reports (load the "dataviz" skill to judge the charts and tables), Events, Recurring Events, Posts editors with Markdown preview, Inquiries, cafe details, two-factor setup; and the Bar Screen (columns, sorting, one-tap steps, sound and mute, pay at the counter, polling). Do static review of src/app/manage, src/app/bar and their module code, then runtime checks: sign in as Manager Christian (you are the ONLY auditor allowed to enrol his authenticator; compute TOTP codes with a small node script, RFC 6238, HMAC-SHA1, 30 s, 6 digits, from the secret shown at setup) and as Barista Annika. Allowed mutations: create your own test entities named "AUDIT TEST ..." and delete them afterwards, and move only Orders you placed yourself. Report functional bugs, missing validation, confusing UX and missing tools a real cafe would need.` },
  { key: 'journeys', title: 'Customer journeys end to end (QA)',
    brief: `Write Playwright scripts against ${A.url} at 375 and 1280 px and run the real customer journeys: browse the menu, open a Menu Item, choose Options (required groups), add to Cart, edit and remove, checkout as Guest and as Member Hoshi, ASAP and Scheduled pickup, Pay at Pickup and online through the fake provider (/dev/pay), the status page polling, then sign in as Barista Annika in another context and move YOUR orders through Accepted, Preparing, Ready, Picked Up, check Stars earned, redeem a Reward. Edge cases: double-click "Place order", back button after placing, two tabs on one Cart, an item that becomes unavailable (do not toggle Sold Out on seeded items; instead read the code path), a promo boundary, the last-order cutoff (read the code), invalid inputs (very long names, emoji, HTML/script in notes), cancel before Accepted, an unpaid online order left to expire (read the code or check the cron route), the status page with a wrong token, sign-in rate limiting. Only touch Orders and Carts you created. Report what breaks, what confuses, and what is missing.` },
]

const FIND_SCHEMA = {
  type: 'object',
  properties: {
    area_summary: { type: 'string' },
    coverage: { type: 'array', items: { type: 'string' } },
    findings: { type: 'array', items: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        kind: { type: 'string', enum: ['bug', 'security', 'inconsistency', 'inefficiency', 'gap', 'test-gap', 'docs', 'improvement', 'feature'] },
        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
        locations: { type: 'array', items: { type: 'string' } },
        evidence: { type: 'string' },
        impact: { type: 'string' },
        recommendation: { type: 'string' },
        effort: { type: 'string', enum: ['S', 'M', 'L'] },
        confidence: { type: 'number' },
        refs: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'kind', 'severity', 'locations', 'evidence', 'impact', 'recommendation', 'effort', 'confidence'],
    } },
  },
  required: ['area_summary', 'coverage', 'findings'],
}

const VERDICT = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['confirmed', 'partly', 'refuted', 'already-handled', 'out-of-scope'] },
    severity_adjusted: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
    reasoning: { type: 'string' },
    corrections: { type: 'string' },
    evidence_checked: { type: 'string' },
  },
  required: ['verdict', 'severity_adjusted', 'reasoning'],
}

const LENSES = [
  'REPRODUCE: trace the exact code path end to end (or run a small read-only check) and decide whether the claimed behaviour really happens.',
  'COUNTER-EVIDENCE: search for guards, constraints, middleware, tests, ADRs or docs that prevent this or make it a deliberate, documented choice.',
  'IMPACT: assume it is real and judge the realistic severity and exploitability for this product (concept cafe, Test Mode payments, but built as if real); downgrade anything theoretical.',
]
const SINGLE_LENS = 'REPRODUCE and COUNTER-EVIDENCE: trace the exact code path, and search for guards, constraints, tests or ADRs that make it a non-issue or a deliberate choice.'
const IDEA_LENS = 'PRODUCT FIT: check whether this already exists in the code or docs (search for it), whether it conflicts with the PRD scope or an ADR (0006 no real money, 0011 native elements first, the dropped Filipino batch), and whether it is genuinely worth recommending for this portfolio concept cafe. Use "already-handled" if it exists, "out-of-scope" if it conflicts or adds little.'

function verifyPrompt(f, lens, key) {
  return `You are a skeptical senior reviewer verifying ONE finding from an audit of the Hoshikopi repository at ${A.repo} (Next.js 16, Prisma, Better Auth; CLAUDE.md rules are in your context). A production build runs at ${A.url} against the seeded dev database; you may make read-only checks against it. Never modify repo files, the databases, or the running app's settings. Scratch files only under ${A.scratch}/verify-${key}/.

Your lens: ${lens}

Default to "refuted" if the evidence does not hold up when you check it yourself. Use "partly" when the core claim holds but details, locations or severity are wrong, and put the fix in "corrections". Use "already-handled" when the code or a test already covers it. Give severity_adjusted for your view of the true severity (for features and improvements: value).

Finding:
${JSON.stringify(f, null, 2)}`
}

const order = ['critical', 'high', 'medium', 'low', 'info']
function pickSeverity(votes, fallback) {
  const s = votes.map(v => v.severity_adjusted).filter(Boolean)
  if (!s.length) return fallback
  const counts = {}
  s.forEach(x => { counts[x] = (counts[x] || 0) + 1 })
  return s.sort((a, b) => (counts[b] - counts[a]) || (order.indexOf(b) - order.indexOf(a)))[0]
}

const BATCH_VERDICT = {
  type: 'object',
  properties: { verdicts: { type: 'array', items: { type: 'object', properties: {
    index: { type: 'integer' },
    verdict: { type: 'string', enum: ['confirmed', 'partly', 'refuted', 'already-handled', 'out-of-scope'] },
    severity_adjusted: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
    reasoning: { type: 'string' },
    corrections: { type: 'string' },
  }, required: ['index', 'verdict', 'severity_adjusted', 'reasoning'] } } },
  required: ['verdicts'],
}

function batchPrompt(key, items) {
  return `You are a skeptical senior reviewer verifying ${items.length} findings from an audit of the Hoshikopi repository at ${A.repo} (Next.js 16, Prisma, Better Auth; CLAUDE.md rules are in your context). A production build runs at ${A.url} against the seeded dev database; you may make read-only checks against it. Never modify repo files, the databases, or the running app's settings. Scratch files only under ${A.scratch}/verify-${key}/.

For each defect finding (bug, security, inconsistency, inefficiency, gap, test-gap, docs): ${SINGLE_LENS} For high and critical ones also judge realistic impact: ${LENSES[2]}
For each feature or improvement: ${IDEA_LENS}

Open the cited files yourself for every finding; do not take the auditor's word. Default to "refuted" if the evidence does not hold up. Use "partly" when the core claim holds but details, locations or severity are wrong, and put the fix in "corrections". Use "already-handled" when the code or a test already covers it. Give severity_adjusted for your view of the true severity (for features and improvements: value). Return exactly one verdict per finding, using its index.

Findings:
${items.map(x => `### [${x.i}]\n${JSON.stringify(x.f, null, 1)}`).join('\n\n')}`
}

// ponytail: one skeptic per batch of 10 (lighter resume); per-finding 3-lens votes if the budget allows a rerun
async function verifyArea(r, key) {
  const items = r.findings.map((f, n) => ({ i: n + 1, f }))
  const chunks = []
  for (let s = 0; s < items.length; s += 10) chunks.push(items.slice(s, s + 10))
  const results = (await parallel(chunks.map((c, n) => () =>
    agent(batchPrompt(key, c), { label: `verify:${key}${chunks.length > 1 ? '#' + (n + 1) : ''}`, phase: 'Verify', schema: BATCH_VERDICT, effort: 'medium' })
  ))).filter(Boolean)
  const byIdx = {}
  results.forEach(res => (res.verdicts || []).forEach(v => { byIdx[v.index] = v }))
  return r.findings.map((f, n) => {
    const v = byIdx[n + 1]
    const ok = !!v && (v.verdict === 'confirmed' || v.verdict === 'partly')
    return { ...f, votes: v ? [v] : [], keep: ok, unchecked: !v, severity_final: ok ? v.severity_adjusted : f.severity }
  })
}

function runDims(list, phaseName) {
  return pipeline(list,
    d => agent(PRE(d.key) + `\n\nYOUR AREA: ${d.title}\n${d.brief}`, { label: `find:${d.key}`, phase: phaseName, schema: FIND_SCHEMA, agentType: d.agentType }),
    (r, d) => r ? verifyArea(r, d.key).then(v => ({ key: d.key, title: d.title, summary: r.area_summary, coverage: r.coverage, findings: v })) : null
  )
}

// Areas reviewed by earlier runs are saved in args.priorPath (docs/audit/findings-2026-11-06.json);
// they are only verified here. args.prior: [{ key, count, passes, summary }]; args.todo: area keys still to review.
const PRIOR = A.prior || []
const TODO = DIMS.filter(d => (A.todo || []).includes(d.key))
log(`reviewing ${TODO.length} new areas (${TODO.map(d => d.key).join(', ')}); verifying ${PRIOR.reduce((n, p) => n + p.count, 0)} saved findings from ${PRIOR.length} areas`)

const PRIOR_VERDICT = {
  type: 'object',
  properties: { verdicts: { type: 'array', items: { type: 'object', properties: {
    index: { type: 'integer' }, title: { type: 'string' }, kind: { type: 'string' },
    verdict: { type: 'string', enum: ['confirmed', 'partly', 'refuted', 'already-handled', 'out-of-scope'] },
    severity_adjusted: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
    effort: { type: 'string', enum: ['S', 'M', 'L'] },
    locations: { type: 'array', items: { type: 'string' } },
    problem: { type: 'string' }, fix: { type: 'string' },
    reasoning: { type: 'string' }, corrections: { type: 'string' },
  }, required: ['index', 'title', 'kind', 'verdict', 'severity_adjusted', 'effort', 'locations', 'problem', 'fix', 'reasoning'] } } },
  required: ['verdicts'],
}

function priorPrompt(p, s, e) {
  return `You are a skeptical senior reviewer verifying saved findings from an audit of the Hoshikopi repository at ${A.repo} (Next.js 16, Prisma, Better Auth; CLAUDE.md rules are in your context). A production build runs at ${A.url} against the seeded dev database; you may make read-only checks against it. Never modify repo files, the databases, or the running app's settings. Scratch files only under ${A.scratch}/verify-${p.key}/.

Open ${A.priorPath}. In "areas", take the entry with key "${p.key}" and verify findings ${s} to ${e} of its "findings" array (1-based: index 1 is the first). Each finding has a "pass" number; this area was reviewed ${p.passes} time(s), so near-duplicates are expected. Verify each on its own.

For each defect finding (bug, security, inconsistency, inefficiency, gap, test-gap, docs): ${SINGLE_LENS} For high and critical ones also judge realistic impact: ${LENSES[2]}
For each feature or improvement: ${IDEA_LENS}

Open the cited files yourself; do not take the auditor's word. Default to "refuted" if the evidence does not hold up. Use "partly" when the core claim holds but details, locations or severity are wrong, and put the fix in "corrections". Use "already-handled" when the code or a test already covers it. Return one verdict per finding with its index, its title, kind, your severity_adjusted (for features and improvements: value), effort, the correct locations, and a short plain problem and fix (two sentences each) the final report can use.`
}

// ponytail: one skeptic per batch of 10 saved findings; per-finding votes if a later run can afford them
async function verifyPrior(p) {
  const ranges = []
  for (let s = 1; s <= p.count; s += 10) ranges.push([s, Math.min(p.count, s + 9)])
  const res = (await parallel(ranges.map(([s, e], n) => () =>
    agent(priorPrompt(p, s, e), { label: `verify:${p.key}${ranges.length > 1 ? '#' + (n + 1) : ''}`, phase: 'Verify', schema: PRIOR_VERDICT, effort: 'medium' })
  ))).filter(Boolean)
  const verdicts = res.flatMap(r => r.verdicts || [])
  return { key: p.key, summary: p.summary, count: p.count, verdicts, unchecked: p.count - new Set(verdicts.map(v => v.index)).size }
}

phase('Find')
const [first, prior] = await Promise.all([
  runDims(TODO, 'Find').then(r => r.filter(Boolean)),
  parallel(PRIOR.map(p => () => verifyPrior(p))).then(r => r.filter(Boolean)),
])
const unchecked = prior.reduce((n, p) => n + p.unchecked, 0)
log(`new areas done: ${first.length}/${TODO.length}; saved areas verified: ${prior.length}/${PRIOR.length}${unchecked ? `; ${unchecked} saved findings got no verdict` : ''}`)

phase('Synthesize')
const all = first
const okVerdict = v => v.verdict === 'confirmed' || v.verdict === 'partly'
const kept = all.flatMap(r => r.findings.filter(f => f.keep).map(f => ({
  area: r.key, title: f.title, kind: f.kind, severity: f.severity_final, severity_found: f.severity,
  locations: f.locations, evidence: (f.evidence || '').slice(0, 900), impact: f.impact, recommendation: f.recommendation,
  effort: f.effort, refs: f.refs || [], verifier: f.votes.map(v => `${v.verdict}: ${(v.reasoning || '').slice(0, 300)}${v.corrections ? ' | correction: ' + v.corrections.slice(0, 300) : ''}`).join(' || '),
}))).concat(prior.flatMap(p => p.verdicts.filter(okVerdict).map(v => ({
  area: p.key, title: v.title, kind: v.kind, severity: v.severity_adjusted, locations: v.locations,
  problem: v.problem, fix: v.fix, effort: v.effort,
  verifier: `${v.verdict}: ${(v.reasoning || '').slice(0, 300)}${v.corrections ? ' | correction: ' + v.corrections.slice(0, 300) : ''}`,
}))))
const dropped = all.flatMap(r => r.findings.filter(f => !f.keep).map(f => ({ area: r.key, title: f.title, kind: f.kind, why: f.unchecked ? 'not checked' : f.votes.map(v => `${v.verdict}: ${(v.reasoning || '').slice(0, 200)}`).join(' || ') })))
  .concat(prior.flatMap(p => p.verdicts.filter(v => !okVerdict(v)).map(v => ({ area: p.key, title: v.title, kind: v.kind, why: `${v.verdict}: ${(v.reasoning || '').slice(0, 200)}` }))))

const SYNTH = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    scorecard: { type: 'array', items: { type: 'object', properties: { area: { type: 'string' }, grade: { type: 'string' }, note: { type: 'string' } }, required: ['area', 'grade', 'note'] } },
    items: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, title: { type: 'string' },
      category: { type: 'string', enum: ['Security', 'Bug', 'Performance', 'Accessibility', 'UX/UI', 'Code quality', 'Data', 'Tests', 'Docs', 'Ops', 'Feature'] },
      severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
      priority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
      effort: { type: 'string', enum: ['S', 'M', 'L'] },
      locations: { type: 'array', items: { type: 'string' } },
      problem: { type: 'string' }, fix: { type: 'string' },
      refs: { type: 'array', items: { type: 'string' } },
      merged_from: { type: 'array', items: { type: 'string' } },
    }, required: ['id', 'title', 'category', 'severity', 'priority', 'effort', 'locations', 'problem', 'fix'] } },
    quick_wins: { type: 'array', items: { type: 'string' } },
    suggested_order: { type: 'array', items: { type: 'object', properties: { batch: { type: 'string' }, item_ids: { type: 'array', items: { type: 'string' } }, why: { type: 'string' } }, required: ['batch', 'item_ids', 'why'] } },
    strengths: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'scorecard', 'items', 'quick_wins', 'suggested_order', 'strengths'],
}
const synth = await agent(`You are the lead reviewer (senior web developer, security engineer and QA lead) writing the final audit backlog for the Hoshikopi repository at ${A.repo}. Below are the findings that survived adversarial verification, each with the verifiers' notes (apply their corrections), plus each area's summary.

Do this:
1. Merge duplicates and near-duplicates across areas into one item (list the source titles in merged_from).
2. Give each item an id by category (SEC-01, BUG-01, PERF-01, A11Y-01, UX-01, CODE-01, DATA-01, TEST-01, DOC-01, OPS-01, FEAT-01), a plain-English title and problem, a concrete fix, locations, effort.
3. Priority: P0 = fix before the demo deploy (batch 5.4) or anything exploitable or breaking a core flow; P1 = next, real quality or correctness gaps; P2 = worthwhile improvements; P3 = nice to have. Features go P1 to P3 by value. Be strict: P0 only for things that truly matter.
4. A scorecard grading each area A to F with a one-line note; a 5 to 8 sentence overall summary; the real strengths of the codebase (so the owner knows what not to break); quick wins (S effort, high value); and a suggested order of work grouped into batches that fit the roadmap style.
Write for the project owner: plain, concrete, no jargon without explanation.

AREA SUMMARIES:
${all.map(r => `- ${r.key}: ${r.summary}`).concat(prior.map(p => `- ${p.key}: ${p.summary}`)).join('\n')}

VERIFIED FINDINGS (${kept.length}):
${JSON.stringify(kept, null, 1)}`, { label: 'synthesize', phase: 'Synthesize', schema: SYNTH })

return {
  synth,
  stats: { new_areas: all.length, saved_areas: prior.length, found: all.reduce((n, r) => n + r.findings.length, 0) + prior.reduce((n, p) => n + p.count, 0), kept: kept.length, dropped: dropped.length, unchecked },
  kept, dropped,
  areas: all.map(r => ({ key: r.key, title: r.title, summary: r.summary, coverage: r.coverage, found: r.findings.length, kept: r.findings.filter(f => f.keep).length }))
    .concat(prior.map(p => ({ key: p.key, summary: p.summary, found: p.count, kept: p.verdicts.filter(okVerdict).length }))),
}
```
