---
status: accepted
date: 2026-10-31
---

# The Staff Second Factor is checked by our guard, not Better Auth's plugin

ADR 0005 says Staff sign in with the email link and must turn on a second factor (TOTP) before using `/manage`. Better Auth's `twoFactor` plugin asks for the code only after password-style sign-ins (`/sign-in/email`, `/sign-in/username`, `/sign-in/phone-number`), not after an email link, and for a signed-in session it checks codes with no attempt limit and replaces the session on first enrolment. So the `identity` module does the step itself:

- `two_factors` (identity) holds one row per Staff member: the TOTP secret, encrypted with `BETTER_AUTH_SECRET` through `better-auth/crypto`, and `confirmed_at`. The first visit creates a pending secret; the same one shows until a code matches.
- `sessions.second_factor_at` marks the session that entered a code. `requireStaff()` sends any `/manage` page or Server Action without it to `/manage/two-factor`; the Bar Screen (`/bar`, `/api/bar`) does not ask.
- Codes are 6 digits every 30 seconds (RFC 6238, SHA-1, the setting every authenticator app reads), checked one step either side against `now()` from `lib/clock.ts`, at most 10 tries per Staff member per 15 minutes, every try counted.
- The page shows a QR code (rendered on the server by `uqr`), the setup key and an `otpauth:` link for a phone.

## Considered options

- **Better Auth's `twoFactor` plugin.** Rejected for the reasons above; its TOTP helper (`@better-auth/utils/otp`) is used instead.
- **Passwords plus the plugin.** Rejected by ADR 0005.
- **Email codes as the second step.** Rejected: the same inbox as the link, so not a second factor.

## Consequences

- No backup codes: a Staff member who loses their phone asks a Manager, who deletes their `two_factors` row (`docs/06-SETUP.md`); the next visit enrols again. A lost Manager phone is fixed the same way by whoever runs the database.
- A code can be used again within its 90-second window. Accepted: it also needs the Staff member's email-link session.
- End-to-end tests read the secret from the e2e database to type the code, as an authenticator would.

## Update 2026-11-15 (batch 10.7)

- The check no longer rides on the path a guard returns to. `requireStaff` asks for the Second Factor on every call except Barista-level work on the Bar Screen (`role` barista and `next` `/bar`): moving Orders, and Sold Out, also when `/manage/menu` posts it. Any Manager-level call asks, so a Manager's Cancel on the Bar Screen asks and comes back to it (audit ID2-07).
- A pass lasts 12 hours, about one long day at the cafe, while the session slides for 7 days with use; then the next Manager page or control asks again (audit SEC1-14).
- Each guard also checks that the session row still exists, so Sign out everywhere stops the Bar Screen on its next request (audit staff:17).
