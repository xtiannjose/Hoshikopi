---
status: accepted
date: 2026-10-31
---

# The Content-Security-Policy allows inline scripts so pages stay prerendered

The architecture doc (section 9) planned a strict policy that allows the inline theme script by its SHA-256 hash. That does not work with Cache Components: a prerendered page also carries Next's own inline scripts (the RSC payload, `self.__next_f.push(...)`, and the Suspense reveal scripts), which differ per page and take no nonce or hash. With `script-src 'self' 'sha256-<theme>'` the theme script ran, but the browser blocked the other nine inline scripts on a Menu Item page and the page never hydrated (checked 2026-10-31 in Chromium against a production build).

So the policy is `script-src 'self' 'unsafe-inline'`, with no hash: a hash or nonce in `script-src` makes browsers ignore `'unsafe-inline'`. Every other directive stays strict: `default-src 'self'`, `connect-src 'self'`, `img-src 'self' data: blob:`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, and `form-action` limited to this site, PayMongo's checkout and Google's sign-in. `'unsafe-eval'` is added in development only.

## Why

- Prerendered public pages are a core choice (ADR 0001, the performance budget): a per-request nonce makes every page dynamic, and the Next 16 CSP guide says nonces do not work with Partial Prerendering.
- No third-party scripts load on any page (PayMongo's checkout is a redirect), so the inline allowance covers only scripts this site writes.
- The real defence against injected scripts is that nothing user-written becomes HTML: React escapes text, Markdown renders without raw HTML (batch 5.1), and no page uses `dangerouslySetInnerHTML` for user content.

## Considered options

- **Nonces through the proxy.** Rejected: every page renders per request, losing prerendering and the speed budget.
- **The theme script by hash only.** Rejected: blocks Next's inline scripts, so nothing hydrates.
- **Next's experimental Subresource Integrity (`experimental.sri`).** Rejected for now: it adds `integrity` to script files only; the inline scripts still need `'unsafe-inline'`.

## Consequences

- An HTML injection bug would be able to run script, so content rendering keeps its rules: no raw HTML in Markdown, no `dangerouslySetInnerHTML` except the theme script and the JSON-LD on `/cafe` and Event pages, which escape every `<` as `<` so Manager-written text cannot close the script tag.
- Revisit when Next can hash or nonce the inline scripts of prerendered pages.
