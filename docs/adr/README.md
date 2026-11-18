# Decisions (ADRs)

> **In plain words:** an ADR (architecture decision record) is a short note that records one important decision about how Hoshikopi is built, and why it was made. This folder holds all 15 of them. Read the table below to see every decision in one sentence, then open the note for the full reasoning.
>
> **Who should read it:** anyone who wants to know why the project works the way it does (the owner, a new developer, a reviewer), and anyone about to change something that an ADR covers.
> **Last checked:** 2026-11-17.

## 1. What an ADR is, and when to write one

"Architecture" here just means how the project is put together: the tools it uses, the rules it follows and the limits it keeps. An ADR holds one decision of that kind. It says what was decided, what else was considered, and what follows from the choice.

Write an ADR when you make a choice that someone could later wonder about or want to undo. Examples: picking a tool, setting a limit, or changing a rule that other parts of the project rely on. A decision made while building a batch (see the [roadmap](../07-ROADMAP.md) section 3) gets its ADR in that batch.

Two rules from [`CLAUDE.md`](../../CLAUDE.md) apply:

- **Check this folder before reopening a decision.** The answer may already be written down.
- **Contradicting an ADR needs a new ADR.** Do not quietly work against one. If a decision must change, write a new ADR that says so. A small later change that keeps the decision stands as a dated "Update" at the bottom of the same note, as ADRs 0003, 0005 and 0015 do.

An old ADR is a record of what was decided at the time. Never rewrite its Context, Decision or Consequences to hide history.

## 2. The 15 decisions

The words used in the table (Pickup Window, Star, Bar Screen, Second Factor and so on) are defined in the [Glossary](../../GLOSSARY.md).

| No. | Title | The decision in one sentence |
| --- | --- | --- |
| 0001 | [One Next.js app organised as a modular monolith](0001-modular-monolith-nextjs.md) | The whole site is one app, split inside into named parts that each own their own data. |
| 0002 | [Money is stored and computed as integer centavos](0002-money-as-integer-centavos.md) | All money is whole centavos (PHP 165.00 is 16500), never decimals, so totals never drift. |
| 0003 | [Payments go through a provider interface; PayMongo in Test Mode, plus a fake provider](0003-payments-paymongo-test-mode.md) | Payments go through one doorway with a pretend provider and PayMongo's Test Mode behind it, and real-money keys are refused. |
| 0004 | [PostgreSQL through Prisma; Docker locally, Neon when hosted](0004-postgres-prisma-neon.md) | The data lives in PostgreSQL, run in Docker on a developer's PC and at Neon online. |
| 0005 | [Better Auth for Members and Staff](0005-better-auth-members-and-staff.md) | People sign in with an email link (Members can also use Google), and Staff add an authenticator code. |
| 0006 | [Hoshikopi is a concept: invented details are labelled and no real money moves](0006-concept-project-no-real-money.md) | Hoshikopi is a portfolio project, so anything invented is labelled and no real money ever moves. |
| 0007 | [Pickup in 15-minute windows with Capacity and an honest Prep Time](0007-pickup-windows-and-capacity.md) | Orders book 15-minute Pickup Windows with a limited Capacity, and the ready time counts the real queue. |
| 0008 | [Stars are a ledger; the balance is a sum](0008-stars-ledger.md) | Stars are a list of entries, and a Member's balance is their total. |
| 0009 | [Live updates by polling first](0009-live-updates-by-polling.md) | Screens ask the server for changes every few seconds instead of holding a live connection open. |
| 0010 | [The look follows the cafe's clock: Day palette by day, Night palette by night](0010-theme-follows-manila-time.md) | The site wears the Day palette from 6 AM and the Night palette from 6 PM, Manila time. |
| 0011 | [Build the design with native elements and CSS (Sample A)](0011-native-elements-and-css.md) | Pages use the browser's own controls and plain CSS, with no component or animation library. |
| 0012 | [Menu and room pictures are AI-generated concept images, with stand-ins until they exist](0012-concept-images-with-stand-ins.md) | Pictures are labelled AI concept images, with calm stand-in panels until they are made. |
| 0013 | [The Content-Security-Policy allows inline scripts so pages stay prerendered](0013-csp-allows-inline-scripts.md) | The security policy allows the site's own inline scripts, so pages can be prepared ahead of time and still work. |
| 0014 | [The Staff Second Factor is checked by our guard, not Better Auth's plugin](0014-staff-second-factor-in-identity.md) | The site checks the Staff authenticator code itself, because the library's version does not fit email-link sign-in. |
| 0015 | [Demo Mode: a visitor plays the barista on their own Order](0015-demo-mode-visitor-plays-the-barista.md) | On the live demo a visitor can move their own Order through the bar's steps, and the demo takes Orders all day. |

ADRs 0001 to 0010 were written in planning. ADRs 0011 to 0015 followed during the build.

## 3. How to add a new ADR

1. **Pick the next number.** The last one is 0015, so the next is `0016`. Numbers are not reused.
2. **Name the file** `NNNN-short-name-in-lowercase.md` with hyphens, for example `0014-staff-second-factor-in-identity.md`. Put it in this folder.
3. **Start with the header**, between lines of three dashes:

   ```
   ---
   status: accepted
   date: 2026-11-17
   ---
   ```

   Use the date of the decision, written as year, month, day. Every ADR so far has the status `accepted`.

4. **Write the title** as a short sentence that states the decision (`# Money is stored and computed as integer centavos`). Directly under it, add the plain-words block:

   ```
   > **In plain words:** two or three sentences: what was decided and why it matters to the cafe or the project.
   ```

5. **Write the body in the shape the existing notes use:**
   - **Context and Decision.** One or two opening paragraphs: the problem and what was decided. Short headings such as "Why" or "Rules" may follow.
   - **Considered options.** Each other choice, with the reason it was not taken.
   - **Consequences.** What this decision makes easy, what it makes harder, and what must be kept true because of it.

6. **Link the notes that relate** with relative links (for example `[ADR 0003](0003-payments-paymongo-test-mode.md)`), and add the new note to the table in section 2 of this page.
7. **Record later changes as dated updates.** If the decision shifts a little later, add a `## Update YYYY-MM-DD` section at the bottom saying what changed and why. If it is reversed, write a new ADR and say which one it replaces.

## Where to go next

- What the site must do: [docs/01-PRD.md](../01-PRD.md).
- How the decisions shape the code: [docs/03-ARCHITECTURE.md](../03-ARCHITECTURE.md).
- Every other document, and the coding words explained: the [docs map](../README.md).
