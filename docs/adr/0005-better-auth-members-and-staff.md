---
status: accepted
date: 2026-10-30
---

# Better Auth for Members and Staff

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
- Until Resend is set up, sign-in links print to the terminal in development only.
- Google sign-in is off until `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist.
