-- Database rules (batch 10.11). Hand-written: Prisma cannot express these.

-- Safe to run again after a failed attempt: Prisma runs it statement by
-- statement, not in one transaction.

-- DATA-06: a NULL made these checks unknown, which Postgres accepts. A row
-- the old checks let through is repaired first: a half-set Promo is no
-- Promo, and an open day with missing times can't take Orders anyway.
UPDATE "menu_items" SET "promo_cents" = NULL, "promo_from" = NULL, "promo_until" = NULL
  WHERE num_nonnulls("promo_cents", "promo_from", "promo_until") IN (1, 2);
UPDATE "special_hours" SET "is_closed" = true
  WHERE NOT "is_closed" AND num_nonnulls("opens_at", "last_order_at", "closes_at") < 3;
ALTER TABLE "menu_items" DROP CONSTRAINT IF EXISTS "menu_items_promo_check";
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_promo_check" CHECK (
  num_nonnulls("promo_cents", "promo_from", "promo_until") = 0
  OR (
    num_nonnulls("promo_cents", "promo_from", "promo_until") = 3
    AND "promo_cents" >= 0 AND "promo_cents" < "base_cents"
    AND "promo_until" >= "promo_from"
  )
);
ALTER TABLE "special_hours" DROP CONSTRAINT IF EXISTS "special_hours_times_check";
ALTER TABLE "special_hours" ADD CONSTRAINT "special_hours_times_check" CHECK (
  "is_closed"
  OR (
    num_nonnulls("opens_at", "last_order_at", "closes_at") = 3
    AND "opens_at" < "last_order_at" AND "last_order_at" <= "closes_at"
  )
);

-- DATA-06: Prisma creates scalar lists nullable and would see SET NOT NULL
-- as drift, so a CHECK keeps NULL out (a NULL also passed the <@ checks).
UPDATE "menu_items" SET "badges" = '{}' WHERE "badges" IS NULL;
UPDATE "menu_items" SET "allergens" = '{}' WHERE "allergens" IS NULL;
UPDATE "options" SET "adds_allergens" = '{}' WHERE "adds_allergens" IS NULL;
UPDATE "cart_lines" SET "option_ids" = '{}' WHERE "option_ids" IS NULL;
UPDATE "favourites" SET "option_ids" = '{}' WHERE "option_ids" IS NULL;
UPDATE "order_lines" SET "option_ids" = '{}' WHERE "option_ids" IS NULL;
ALTER TABLE "menu_items" DROP CONSTRAINT IF EXISTS "menu_items_arrays_check";
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_arrays_check"
  CHECK ("badges" IS NOT NULL AND "allergens" IS NOT NULL);
ALTER TABLE "options" DROP CONSTRAINT IF EXISTS "options_arrays_check";
ALTER TABLE "options" ADD CONSTRAINT "options_arrays_check"
  CHECK ("adds_allergens" IS NOT NULL);
ALTER TABLE "cart_lines" DROP CONSTRAINT IF EXISTS "cart_lines_option_ids_check";
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_option_ids_check"
  CHECK ("option_ids" IS NOT NULL);
ALTER TABLE "favourites" DROP CONSTRAINT IF EXISTS "favourites_option_ids_check";
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_option_ids_check"
  CHECK ("option_ids" IS NOT NULL);
ALTER TABLE "order_lines" DROP CONSTRAINT IF EXISTS "order_lines_option_ids_check";
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_option_ids_check"
  CHECK ("option_ids" IS NOT NULL);

-- DATA-04: each Order earns, reserves, releases and reverses at most once,
-- and a Member gets one Birthday Treat a year (its reason names the year).
CREATE UNIQUE INDEX IF NOT EXISTS "star_entries_once_per_order" ON "star_entries" ("order_id", "kind")
  WHERE "kind" IN ('earn', 'reserve', 'release', 'reverse');
CREATE UNIQUE INDEX IF NOT EXISTS "star_entries_birthday_once" ON "star_entries" ("member_id", "reason")
  WHERE "kind" = 'birthday';
