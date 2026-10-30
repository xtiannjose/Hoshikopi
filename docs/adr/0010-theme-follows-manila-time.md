---
status: accepted
date: 2026-10-30
---

# The look follows the cafe's clock: Day palette by day, Night palette by night

The owner compared the Day and Night wireframes (`docs/05-DESIGN-SYSTEM.md` section 1.2) and chose Night's layout and content with both palettes: Day (cream paper, kopi brown, paper grain) from 6:00 AM, and Night (night ink, moonlight) from 6:00 PM, Manila time. The site changes when the cafe does, which fits "open till the stars are out".

Considered: one palette with a light and dark mode that follows the device setting. Rejected because most devices always report light or dark, so the clock would never decide, and the clock is the idea.

## Consequences

- The palette is chosen in the browser, never on the server, so pages stay prerendered. A small inline script in the root layout sets `data-theme` on `<html>` before first paint from the Manila hour and any saved choice, then flips it at 6:00 and 18:00 while the page is open. It takes the Manila offset from `lib/clock.ts`.
- Visitors can pin Day or Night with a header switch (Auto, Day, Night), saved per browser, for comfort or accessibility. Auto is the default.
- Every token, component and photo treatment must pass the contrast checks in both palettes; Playwright freezes the clock to test both.
- The Bar Screen keeps the night palette at all hours.
