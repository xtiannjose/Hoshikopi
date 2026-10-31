---
status: accepted
date: 2026-10-31
---

# Menu and room pictures are AI-generated concept images, with stand-ins until they exist

Menu Item photos follow the room photos (PRD section 2): AI-generated, in one consistent style, each labelled "Concept image" where it is shown and listed in `docs/ASSETS.md` with the prompt that made it. Until a picture exists, its slot shows a stand-in: a calm panel in the palette's `--muted` colour with one Phosphor line icon for the Category. The stand-in is decorative and hidden from screen readers; the page never describes a photo it does not show.

## Why

- Generated pictures need no rights clearance and can show one consistent cafe that does not exist, which suits the concept (ADR 0006). Stock photos would show real cafes and real cups that are not Hoshikopi's.
- The build environment had no image generator on 2026-10-31, and the owner asked for the site to be built straight through, so the code ships with stand-ins and the slots are ready: each one has a file name, a size and a prompt.

## Considered options

- **Stock photos (Unsplash, Pexels).** Rejected: real places and products presented as Hoshikopi's.
- **Own photos.** Not possible: the cafe is invented.
- **Placeholder services (random photos).** Rejected: random scenes are misleading and look broken.

## Consequences

- Menu pictures are 4:3 WebP files at `public/menu/<slug>.webp` (1200 by 900, under 80 kB at card size); room pictures are at `public/room/<name>.webp`. A Menu Item shows its picture once `photo_url` is set (by seed or in `/manage/menu`, batch 1.5).
- Every seeded Menu Item has alt text now, written as a menu would describe the item, ready for its picture.
- Pictures are captioned "Concept image" on `/cafe` and Home; menu cards carry the Concept Notice in the footer instead of a caption on every card.
