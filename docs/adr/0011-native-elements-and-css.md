---
status: accepted
date: 2026-10-31
---

# Build the design with native elements and CSS (Sample A)

Hoshikopi's pages are built with native HTML elements (radios, checkboxes, `details`, `dialog`, popovers), Tailwind CSS on the design tokens, and CSS transitions. No component or animation library is added.

## Why

- The owner asked for the whole site to be built straight through (2026-10-31), so batch 1.1 did not build two samples to compare. Sample A is the lower-risk default: it is what the design system's principle 4 ("native where it works") and section 7 ("CSS first") already ask for.
- The performance budget (`docs/05-DESIGN-SYSTEM.md` section 11) caps first-load JavaScript at 170 kB; native controls and CSS motion cost almost nothing against it.
- The iOne website replaced most of its library parts with native elements and CSS later (`docs/08-TOOLING.md` section 6).

## Considered options

- **Sample B: library parts (Kokonut, beUI, Animate UI) and Motion on Home and Stars.** Not built. It stays open: the owner can ask for it, and a new ADR would replace this one for those two pages.

## Consequences

- Motion is CSS only: transitions, `@starting-style`, View Transitions where supported, all off under `prefers-reduced-motion`.
- The typewriter mono (Courier Prime) stays as the third family for prices in the printed menu, notes, dates and small labels.
- Icons come from Phosphor (`@phosphor-icons/react`, regular weight).
