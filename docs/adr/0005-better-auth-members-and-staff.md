---
status: accepted
date: 2026-10-30
---

# Better Auth for Members and Staff

> **In plain words:** Members and Staff sign in with a link sent to their email (Members can also use Google), not with passwords. Staff also use a 6-digit code from an authenticator app before they can open the Manager pages. This keeps sign-in simple for customers and stricter for the people who can change prices and refund money.

Better Auth (the library Hoshimono uses) handles sessions in HTTP-only cookies.

- **Members** sign in with an email link or Google. The first sign-in creates the Member. Guests can order without an account but earn no Stars.
- **Staff** are users with the role `barista` or `manager`, created by a Manager invite. They sign in with the email link and must turn on a second factor (TOTP) before using `/manage`. Baristas can use `/bar` without it on the cafe tablet, which stays signed in.
- `requireMember()` and `requireStaff(role)` guard pages, Server Actions and route handlers; every Staff write is recorded in `audit_log`.

## Considered options

- **Passwords.** Rejected: more to secure and to reset; email links fit a cafe's occasional visits.
- **SMS codes** (Hoshimono has them). Deferred: they cost money per message and are not needed for a portfolio demo.
- **A hosted auth service** (Clerk, Auth0). Rejected: another vendor and account for what one library does.

## Consequences

- Sign-in email sends are rate-limited per address and IP in a Postgres-backed limiter, as in Hoshimono (Better Auth's own limiter does not see Server Action calls).
- Until Resend is set up, sign-in links print to the terminal in development only. On Vercel, real people's links are never logged; the seeded demo accounts (`@hoshikopi.example`, a reserved domain that receives no mail) always have their links written to the Vercel logs, which only the project's owner can read, so the owner can sign in as them on the live demo.
- Google sign-in is off until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist.

## Update 2026-11-07

Google sign-in is on for the live demo: an OAuth client "Hoshikopi web" in the Google Cloud project "Hoshikopi", published (In production) with only the basic name and email scopes, so it needs no Google review. Its keys are set in Vercel for Production only. Visitors can now sign in without the seeded demo accounts or Resend.

Mobile number sign-in (SMS codes) was considered again and stays deferred: every text costs money and Philippine senders must be registered, and without a provider the codes would only reach the logs, so visitors still could not use it. The owner chose Google instead. Adding phone sign-in later needs a new ADR.

There is no Staff invite: a Manager gives a role at `/manage/staff`, by email, to someone who has signed in once (batch 8.5, STAFF-10), and taking a role away ends that person's sessions.

## Update 2026-11-15

Sign-in links are limited per IP first, then per address from that IP (3 in 15 minutes), then per address from anywhere (5 in 15 minutes), so a stranger on another connection uses up only their own share (audit ID2-05). One on the same IP, or with several connections, still can, since any per-address cap can be used up by others; Google sign-in and a session already open are the way around it. A link's token is stored only as a SHA-256 hash (`storeToken: "hashed"`), and starting Google sign-in is limited per IP like the link (batch 10.6).

## Update 2026-11-15 (batch 10.7)

Sold Out today and back on is on the Bar Screen, so a Barista marks it without the Second Factor (STAFF-03, audit staff:8); `/manage/menu` posts the same action. The Bar Screen shows the Manage link to Managers only. Lowering someone's role needs the role the Manager saw on their row, so Add Staff can only give or raise a role (audit staff:16).
