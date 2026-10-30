---
status: accepted
date: 2026-10-30
---

# One Next.js app organised as a modular monolith

Customer pages, Staff pages (Bar Screen, `/manage`), webhooks and the daily cron live in a single Next.js 16 app deployed as one unit. Business logic sits in `src/modules/*` (`menu`, `cafe`, `cart`, `ordering`, `payments`, `loyalty`, `content`, `identity`, `notify`), each with one public `index.ts`. This is the same shape as Hoshimono, so patterns and lessons carry over.

## Considered options

- **Separate API backend plus a Next.js frontend.** Rejected: doubles deployment, auth and typing for one developer and one cafe.
- **A hosted ordering platform (Square Online, Toast) or headless commerce.** Rejected: the project is a portfolio piece whose point is the ordering, capacity and loyalty logic.
- **A static site with a form.** Rejected: order ahead, payments, Stars and the Bar Screen need a database and server logic.

## Consequences

- Module boundaries are enforced by an ESLint import rule (no imports from `src/modules/*/internal/**` outside the module) and by review.
- Modules return results the same way: `null` for missing reads, `{ ok: false, reason }` for business refusals, `{ ok: false, errors }` for form checks; bugs throw and are caught at the edge.
- Work that must happen on time (expiring unpaid Orders) runs on read, not in a job queue, because the host runs cron once a day ([ADR 0007](0007-pickup-windows-and-capacity.md), `docs/03-ARCHITECTURE.md` section 12).
