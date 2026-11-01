-- Promos and seasonal Menu Items (MENU-06).
ALTER TABLE "menu_items" ADD COLUMN "promo_cents" INTEGER;
ALTER TABLE "menu_items" ADD COLUMN "promo_from" DATE;
ALTER TABLE "menu_items" ADD COLUMN "promo_until" DATE;
ALTER TABLE "menu_items" ADD COLUMN "available_until" DATE;

-- A Promo is all three or none, lower than the Base Price, and in order.
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_promo_check" CHECK (
  ("promo_cents" IS NULL AND "promo_from" IS NULL AND "promo_until" IS NULL)
  OR (
    "promo_cents" >= 0 AND "promo_cents" < "base_cents"
    AND "promo_from" IS NOT NULL AND "promo_until" >= "promo_from"
  )
);

-- Data: the seeded demo Promo and seasonal drink on databases seeded earlier.
UPDATE "menu_items"
SET "promo_cents" = 15500,
    "promo_from" = CURRENT_DATE - 1,
    "promo_until" = CURRENT_DATE + 30
WHERE "slug" = 'matcha-latte' AND "promo_cents" IS NULL AND "base_cents" > 15500;

UPDATE "menu_items" SET "available_until" = CURRENT_DATE + 60
WHERE "slug" = 'calamansi-honey-soda' AND "available_until" IS NULL;
