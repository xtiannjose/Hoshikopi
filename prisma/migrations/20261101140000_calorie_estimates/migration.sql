-- Calorie estimates (MENU-10): invented like every detail (ADR 0006).
ALTER TABLE "menu_items" ADD COLUMN "calorie_kcal" SMALLINT;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_calorie_kcal_check"
  CHECK ("calorie_kcal" IS NULL OR "calorie_kcal" BETWEEN 0 AND 3000);

-- Data: the seeded menu's estimates on databases seeded earlier.
UPDATE "menu_items" AS item SET "calorie_kcal" = v.kcal
FROM (VALUES
  ('kopi-hitam', 90),
  ('hoshi-latte', 260),
  ('spanish-latte', 240),
  ('ube-latte', 250),
  ('cafe-mocha', 290),
  ('cold-brew', 80),
  ('matcha-latte', 210),
  ('tablea-tsokolate', 280),
  ('calamansi-honey-soda', 140),
  ('barako-chai', 220),
  ('tanglad-ginger-tea', 60),
  ('ube-pandesal', 210),
  ('ensaymada', 340),
  ('butter-croissant', 270),
  ('banana-bread', 310),
  ('tapa-rice-bowl', 650),
  ('longganisa-pandesal', 420)
) AS v(slug, kcal)
WHERE item."slug" = v.slug AND item."calorie_kcal" IS NULL;
