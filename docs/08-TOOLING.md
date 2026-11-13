# Tooling: skills, agents and libraries

Status: v0.2, 2026-11-07. Which tool fits which job on Hoshikopi.

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
| 3300, 3400 | Ad-hoc production servers for reviews and Lighthouse runs |
| 5434 | Docker Postgres (`hoshikopi-db`) |

Stop every server you start. On Windows a server started through `npx` can outlive its shell; check with `Get-NetTCPConnection -LocalPort <port>` and stop only the process whose command line matches.

## 4. Libraries

| Library | Why | Phase |
| --- | --- | --- |
| `next`, `react`, `react-dom` | The app | 0 |
| `tailwindcss`, `@tailwindcss/turbopack` | Styling with tokens | 0 |
| `@prisma/client`, `prisma`, `@prisma/adapter-pg`, `pg` | Database access and migrations | 0 |
| `dotenv`, `tsx` | Prisma, the seed and the test setup read `.env` files; `tsx` runs the seed and the e2e reset | 0 |
| `better-auth` | Sessions, email link, Google, roles | 0 |
| `zod` | Parsing every input at the edge | 0 |
| `@phosphor-icons/react` | Icons | 0 |
| `vitest`, `@playwright/test`, `@axe-core/playwright` | Tests | 0 |
| `eslint`, `eslint-config-next`, `prettier`, `prettier-plugin-tailwindcss`, `typescript`, `@types/*` | Quality gates in `npm run qa` | 0 |
| `react-markdown` | The cafe's space, directions and story; Events and Posts | 1 |
| (none) | Emails go to Resend's REST API with `fetch`, like PayMongo; no SDK | 2 |
| `@better-auth/utils`, `uqr` | Staff Second Factor: TOTP codes and the setup QR code (ADR 0014) | 5 |
| `@vercel/blob` | Menu photos on Vercel | 5 |

Add a library only when the platform and installed packages cannot do the job, and say why in the batch or an ADR. No component or animation library: native elements and CSS (ADR 0011). No PayMongo SDK: its REST API is called with `fetch`.

## 5. Machine facts

The owner works on two PCs, both with PowerShell and Git Bash, the project at `C:\Users\cjose\Documents\Projects\Personal\Hoshikopi`. Check `node -v` and `gh auth status` at the start of a session to know which one you are on.

| | Windows 11 Home Single Language (checked 2026-11-13) | Windows 10 Pro (checked 2026-11-07) |
| --- | --- | --- |
| Node, npm | 24.18.0, 11.16.0 | 24.19.0, 11.17.0 |
| Docker Desktop | 29.8.2 | 29.8.2 |
| Chrome (Lighthouse uses it) | 157.0.8103.51 | 156.0.8078.80 |
| `gh` | 2.101, **not signed in**: run `gh auth login` once | 2.101, signed in |

- Docker Desktop is installed but not always running; start it before database work. Playwright's Chromium is installed.
- Each PC has its own `.env.local`, `.env.test` and local databases (git-ignored), so local data differs between them.
- GitHub: `origin` is https://github.com/xtiannjose/Hoshikopi, the project's only copy. Push and open pull requests only when the user asks; the user merges them.

## 6. Prompts that work

Start of a session:

> Read CLAUDE.md and docs/07-ROADMAP.md. Take the next unchecked batch, make its branch, build it test-first where the roadmap says so, run npm run qa (and test:e2e for UI), show me the result at 375 and 1280 px, then tick the batch.

Before a merge:

> Run code-review and security-review on this branch, fix what is confirmed, run qa:full, then summarise what changed for me in plain words.
