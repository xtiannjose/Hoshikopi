-- Pairings (MENU-08) and Night Barista Picks (INFO-13).
ALTER TABLE "menu_items" ADD COLUMN "pairing_id" TEXT;

ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_pairing_id_fkey" FOREIGN KEY ("pairing_id") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Allow the new badge key.
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_badges_check";
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_badges_check"
  CHECK ("badges" <@ ARRAY['new', 'best_seller', 'barista_pick', 'night_pick', 'vegan', 'no_caffeine']);

-- Data: the seeded menu's pairings and Night picks on databases seeded
-- earlier (the live demo). Fresh databases have no rows yet; the seed sets
-- the same. A Manager's own choices are kept.
UPDATE "menu_items" AS item SET "pairing_id" = pair."id"
FROM (VALUES
  ('kopi-hitam', 'banana-bread'),
  ('hoshi-latte', 'ube-pandesal'),
  ('spanish-latte', 'ensaymada'),
  ('ube-latte', 'ube-pandesal'),
  ('cafe-mocha', 'banana-bread'),
  ('cold-brew', 'butter-croissant'),
  ('matcha-latte', 'butter-croissant'),
  ('tablea-tsokolate', 'ensaymada'),
  ('calamansi-honey-soda', 'tapa-rice-bowl'),
  ('barako-chai', 'banana-bread'),
  ('tanglad-ginger-tea', 'ensaymada'),
  ('ube-pandesal', 'hoshi-latte'),
  ('ensaymada', 'tablea-tsokolate'),
  ('butter-croissant', 'kopi-hitam'),
  ('banana-bread', 'cold-brew'),
  ('tapa-rice-bowl', 'calamansi-honey-soda'),
  ('longganisa-pandesal', 'kopi-hitam')
) AS seeded(slug, pair_slug)
JOIN "menu_items" AS pair ON pair."slug" = seeded.pair_slug
WHERE item."slug" = seeded.slug AND item."pairing_id" IS NULL;

UPDATE "menu_items" SET "badges" = array_append("badges", 'night_pick')
WHERE "slug" IN ('cafe-mocha', 'tanglad-ginger-tea', 'banana-bread')
  AND NOT ('night_pick' = ANY("badges"))
  AND (SELECT count(*) FROM "menu_items" WHERE 'night_pick' = ANY("badges")) = 0;
