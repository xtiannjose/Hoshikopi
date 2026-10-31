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
