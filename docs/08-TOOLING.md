# Tooling: skills, agents and libraries

Status: draft v0.1, 2026-10-30. Which tool fits which job on Hoshikopi.

## 1. Claude Code skills

| Job | Skill | Notes |
| --- | --- | --- |
| Money, Capacity, Prep Time, Stars, Order Status, webhooks | `tdd` | Test first, red then green, against the real test database |
| Comparing build approaches (batch 1.1) or trying a tricky screen | `prototype` with `design-taste-frontend` | Throwaway; the pick goes into an ADR |
| Any visible UI | `design-taste-frontend`, then `ui-ux-pro-max` for a review | Read `docs/05-DESIGN-SYSTEM.md` first |
| Motion, the Star Card fill, View Transitions | `apple-design` | CSS first; reduced motion always |
| Starting the app, screenshots at 375, 768, 1280 px | `run` | Look at it before calling a batch done |
| A bug with an unknown cause | `diagnosing-bugs` | Reproduce, measure, then fix |
| Before merging a batch | `code-review`, then `simplify` | `security-review` for auth, checkout, payments and webhooks |
| A new domain word or a decision | `domain-modeling` | Updates `GLOSSARY.md` or adds an ADR |
| Researching a library or a rule | `research` | Writes to `docs/research/` with sources |
| Stress-testing a plan with the owner | `grilling` | Before a phase with open questions |
| Walking the owner through account setup (Neon, Vercel, PayMongo, Resend, Google) | `wizard` | Steps only a person can do |
| Reports charts (Phase 6) | `dataviz` | One palette, accessible colours |
| Editing `CLAUDE.md` or these docs for agents | `writing-for-agents` | Keep pointers sharp, files short |

## 2. Subagents

- At most 4 at once; give each a written brief (goal, files it may write, what not to touch, what to return).
- Two agents never write the same file.
- Good uses: independent research, a read-only code or security review, a keyboard-only accessibility check against a production build on its own port.
- Read what an agent wrote before relying on it; its summary is a claim, not proof.

## 3. Ports and servers

| Port | Use |
| --- | --- |
| 3000 | `npm run dev` |
| 3100 | Playwright (production build) |
| 3300, 3400 | Ad-hoc production servers for reviews and `npm run perf` |
| 5434 | Docker Postgres (`hoshikopi-db`) |

Stop every server you start. On Windows a server started through `npx` can outlive its shell; check with `Get-NetTCPConnection -LocalPort <port>` and stop only the process whose command line matches.

## 4. Libraries (planned)

| Library | Why | Phase |
| --- | --- | --- |
| `next`, `react`, `react-dom` | The app | 0 |
| `tailwindcss` | Styling with tokens | 0 |
| `@prisma/client`, `prisma` | Database access and migrations | 0 |
| `better-auth` | Sessions, email link, Google, roles, TOTP | 0 |
| `zod` | Parsing every input at the edge | 0 |
| `@phosphor-icons/react` | Icons | 0 |
| `vitest`, `@playwright/test`, `@axe-core/playwright` | Tests | 0 |
| `react-markdown` | The cafe's space, directions and story; Events and Posts | 1 |
| (none) | Emails go to Resend's REST API with `fetch`, like PayMongo; no SDK | 2 |
| `motion`, shadcn registry parts (Kokonut, beUI, Animate UI) | Sample B in batch 1.1; kept only if its ADR picks Sample B | 1 |

Add a library only when the platform and installed packages cannot do the job, and say why in the batch or an ADR. No PayMongo SDK: its REST API is called with `fetch`.

## 5. Machine facts (checked 2026-10-30)

- Windows 11, PowerShell and Git Bash; Node 24.18, npm 11.16.
- Docker Desktop is installed but not always running; start it before database work.
- Chrome 156 is installed (Lighthouse uses it); Playwright's Chromium is installed.
- Google Drive for desktop is drive `G:`; project copies go to `G:\My Drive\Coding Projects\Personal\<Project>\<project>.bundle`.
- GitHub is back (2026-10-31): `origin` is https://github.com/xtiannjose/Hoshikopi; `gh` 2.101 is installed and signed in. Push and open pull requests only when the user asks; the user merges them.

## 6. References

- Sibling projects with the same stack and habits: Hoshimono (`D:\Coding\projects\Personal\Hoshimono`, online supermarket) and the iOne Resources website (`D:\Coding\projects\ione\IONE-WEBSITE`). Reuse their patterns (module results, centavos, rate limits, security headers, quality tools) rather than reinventing them; never edit them from this project.
- Before adding any UI library, read `D:\Coding\projects\ione\IONE-WEBSITE\docs\DESIGN-LIBS.md`: install recipes, licences and pitfalls for Kokonut, beUI, Animate UI, coss and Motion, tested on this stack. iOne later replaced most of them with native elements and CSS.

## 7. Prompts that work

Start of a session:

> Read CLAUDE.md and docs/07-ROADMAP.md. Take the next unchecked batch, make its branch, build it test-first where the roadmap says so, run npm run qa (and test:e2e for UI), show me the result at 375 and 1280 px, then tick the batch.

Before a merge:

> Run code-review and security-review on this branch, fix what is confirmed, run qa:full, then summarise what changed for me in plain words.
