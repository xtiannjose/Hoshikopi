-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('placed', 'paid', 'accepted', 'preparing', 'ready', 'picked_up', 'cancelled', 'expired', 'refunded');

-- CreateEnum
CREATE TYPE "PickupKind" AS ENUM ('asap', 'scheduled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('gcash', 'maya', 'card', 'pay_at_pickup');

-- CreateEnum
CREATE TYPE "ActorKind" AS ENUM ('customer', 'staff', 'system', 'webhook');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'expired', 'refunded');

-- CreateEnum
CREATE TYPE "StarKind" AS ENUM ('earn', 'reserve', 'release', 'reverse', 'adjust');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'barista', 'manager');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "base_cents" INTEGER NOT NULL,
    "is_drink" BOOLEAN NOT NULL,
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photo_url" TEXT,
    "photo_alt" TEXT,
    "sold_out_on" DATE,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_select" INTEGER NOT NULL,
    "max_select" INTEGER NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "option_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_option_groups" (
    "menu_item_id" TEXT NOT NULL,
    "option_group_id" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_option_groups_pkey" PRIMARY KEY ("menu_item_id","option_group_id")
);

-- CreateTable
CREATE TABLE "options" (
    "id" TEXT NOT NULL,
    "option_group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "delta_cents" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "adds_allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sold_out_on" DATE,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opening_hours" (
    "weekday" SMALLINT NOT NULL,
    "opens_at" TIME(0) NOT NULL,
    "last_order_at" TIME(0) NOT NULL,
    "closes_at" TIME(0) NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("weekday")
);

-- CreateTable
CREATE TABLE "special_hours" (
    "day" DATE NOT NULL,
    "is_closed" BOOLEAN NOT NULL,
    "opens_at" TIME(0),
    "last_order_at" TIME(0),
    "closes_at" TIME(0),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "special_hours_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "capacity_rules" (
    "weekday" SMALLINT NOT NULL,
    "drinks_per_window" INTEGER NOT NULL,
    "food_per_window" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "capacity_rules_pkey" PRIMARY KEY ("weekday")
);

-- CreateTable
CREATE TABLE "cafe_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ordering_paused_until" TIMESTAMPTZ(3),
    "pause_message" TEXT,
    "prep_base_minutes" DECIMAL(4,1) NOT NULL,
    "prep_per_drink_minutes" DECIMAL(4,1) NOT NULL,
    "order_code_prefix" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "map_lat" DECIMAL(8,5) NOT NULL,
    "map_lng" DECIMAL(8,5) NOT NULL,
    "directions_md" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "space_md" TEXT NOT NULL,
    "story_md" TEXT NOT NULL,
    "wifi" BOOLEAN,
    "power_outlets" BOOLEAN,
    "pets_allowed" BOOLEAN,
    "smoking_allowed" BOOLEAN,
    "restroom" BOOLEAN,
    "step_free_entrance" BOOLEAN,
    "accessible_restroom" BOOLEAN,
    "laptop_note" TEXT,
    "pets_note" TEXT,
    "parking_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cafe_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "guest_token_hash" TEXT,
    "member_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_lines" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "option_ids" TEXT[],
    "quantity" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "choice_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cart_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "service_day" DATE NOT NULL,
    "code" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "member_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "pickup_kind" "PickupKind" NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "reward_stars" INTEGER NOT NULL DEFAULT 0,
    "access_token_hash" TEXT NOT NULL,
    "paid_at_counter" BOOLEAN NOT NULL DEFAULT false,
    "cancel_reason" TEXT,
    "placed_at" TIMESTAMPTZ(3) NOT NULL,
    "paid_at" TIMESTAMPTZ(3),
    "accepted_at" TIMESTAMPTZ(3),
    "ready_at" TIMESTAMPTZ(3),
    "picked_up_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_lines" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "menu_item_id" TEXT,
    "name" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "unit_cents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_cents" INTEGER NOT NULL,
    "is_drink" BOOLEAN NOT NULL,
    "is_reward" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "from_status" "OrderStatus",
    "to_status" "OrderStatus" NOT NULL,
    "actor_kind" "ActorKind" NOT NULL,
    "actor_id" TEXT,
    "reason" TEXT,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_window_usage" (
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "service_day" DATE NOT NULL,
    "drinks" INTEGER NOT NULL DEFAULT 0,
    "food" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pickup_window_usage_pkey" PRIMARY KEY ("window_start")
);

-- CreateTable
CREATE TABLE "order_code_counters" (
    "service_day" DATE NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_code_counters_pkey" PRIMARY KEY ("service_day")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_checkout_id" TEXT NOT NULL,
    "provider_payment_id" TEXT,
    "checkout_url" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "provider_refund_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "star_entries" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "order_id" TEXT,
    "kind" "StarKind" NOT NULL,
    "stars" INTEGER NOT NULL,
    "reason" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "star_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "body_md" TEXT NOT NULL,
    "photo_url" TEXT,
    "photo_alt" TEXT,
    "price_cents" INTEGER,
    "signup_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body_md" TEXT NOT NULL,
    "cover_url" TEXT,
    "cover_alt" TEXT,
    "published_at" TIMESTAMPTZ(3),
    "author_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'customer',
    "birth_month" SMALLINT,
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ(3),
    "refresh_token_expires_at" TIMESTAMPTZ(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key","window_start")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_slug_key" ON "menu_items"("slug");

-- CreateIndex
CREATE INDEX "menu_items_category_id_idx" ON "menu_items"("category_id");

-- CreateIndex
CREATE INDEX "options_option_group_id_idx" ON "options"("option_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_guest_token_hash_key" ON "carts"("guest_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "carts_member_id_key" ON "carts"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_lines_cart_id_choice_key_key" ON "cart_lines"("cart_id", "choice_key");

-- CreateIndex
CREATE INDEX "orders_status_window_start_idx" ON "orders"("status", "window_start");

-- CreateIndex
CREATE INDEX "orders_member_id_idx" ON "orders"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_service_day_code_key" ON "orders"("service_day", "code");

-- CreateIndex
CREATE INDEX "order_lines_order_id_idx" ON "order_lines"("order_id");

-- CreateIndex
CREATE INDEX "order_events_order_id_idx" ON "order_events"("order_id");

-- CreateIndex
CREATE INDEX "pickup_window_usage_service_day_idx" ON "pickup_window_usage"("service_day");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_provider_checkout_id_idx" ON "payments"("provider_checkout_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_provider_provider_event_id_key" ON "payment_events"("provider", "provider_event_id");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "star_entries_member_id_idx" ON "star_entries"("member_id");

-- CreateIndex
CREATE INDEX "star_entries_order_id_idx" ON "star_entries"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_published_at_idx" ON "posts"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "audit_log_target_type_target_id_idx" ON "audit_log"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_option_groups" ADD CONSTRAINT "menu_item_option_groups_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_option_groups" ADD CONSTRAINT "menu_item_option_groups_option_group_id_fkey" FOREIGN KEY ("option_group_id") REFERENCES "option_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_option_group_id_fkey" FOREIGN KEY ("option_group_id") REFERENCES "option_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "star_entries" ADD CONSTRAINT "star_entries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "star_entries" ADD CONSTRAINT "star_entries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- hand-written: rules Prisma cannot express (docs/04-DATA-MODEL.md section 4) ----------

-- Prices are never negative (invariant 1).
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_base_cents_check" CHECK ("base_cents" >= 0);
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_badges_check"
  CHECK ("badges" <@ ARRAY['new', 'best_seller', 'barista_pick', 'vegan', 'no_caffeine']);
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_allergens_check"
  CHECK ("allergens" <@ ARRAY['milk', 'egg', 'wheat', 'soy', 'peanuts', 'tree_nuts', 'fish', 'shellfish', 'sesame']);
ALTER TABLE "options" ADD CONSTRAINT "options_delta_cents_check" CHECK ("delta_cents" >= 0);
ALTER TABLE "options" ADD CONSTRAINT "options_adds_allergens_check"
  CHECK ("adds_allergens" <@ ARRAY['milk', 'egg', 'wheat', 'soy', 'peanuts', 'tree_nuts', 'fish', 'shellfish', 'sesame']);
ALTER TABLE "option_groups" ADD CONSTRAINT "option_groups_select_check"
  CHECK ("min_select" >= 0 AND "max_select" >= "min_select" AND "max_select" >= 1);

-- Days of the week and Capacity.
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6);
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_times_check"
  CHECK ("opens_at" < "last_order_at" AND "last_order_at" <= "closes_at");
ALTER TABLE "special_hours" ADD CONSTRAINT "special_hours_times_check"
  CHECK ("is_closed" OR ("opens_at" < "last_order_at" AND "last_order_at" <= "closes_at"));
ALTER TABLE "capacity_rules" ADD CONSTRAINT "capacity_rules_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6);
ALTER TABLE "capacity_rules" ADD CONSTRAINT "capacity_rules_counts_check"
  CHECK ("drinks_per_window" >= 0 AND "food_per_window" >= 0);
ALTER TABLE "cafe_settings" ADD CONSTRAINT "cafe_settings_singleton_check" CHECK ("id" = 1);

-- A Cart has exactly one owner (invariant 9); Lines stay small.
ALTER TABLE "carts" ADD CONSTRAINT "carts_one_owner_check"
  CHECK (("guest_token_hash" IS NULL) <> ("member_id" IS NULL));
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_quantity_check" CHECK ("quantity" BETWEEN 1 AND 20);
ALTER TABLE "cart_lines" ADD CONSTRAINT "cart_lines_note_check" CHECK (char_length("note") <= 140);

-- Orders: a way to reach the Customer, sane money (invariant 2 in part).
ALTER TABLE "orders" ADD CONSTRAINT "orders_contact_check"
  CHECK ("customer_email" IS NOT NULL OR "customer_phone" IS NOT NULL);
ALTER TABLE "orders" ADD CONSTRAINT "orders_money_check" CHECK ("total_cents" >= 0 AND "reward_stars" >= 0);
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_money_check"
  CHECK ("unit_cents" >= 0 AND "quantity" >= 1 AND "line_cents" = "unit_cents" * "quantity");
ALTER TABLE "pickup_window_usage" ADD CONSTRAINT "pickup_window_usage_counts_check"
  CHECK ("drinks" >= 0 AND "food" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK ("amount_cents" >= 0);
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_amount_check" CHECK ("amount_cents" >= 0);

-- order_events is append-only (invariant 6).
CREATE FUNCTION "order_events_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'order_events rows are never updated or deleted';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "order_events_append_only" BEFORE UPDATE OR DELETE ON "order_events"
  FOR EACH ROW EXECUTE FUNCTION "order_events_append_only"();

-- Star entries carry the sign their kind implies (ADR 0008).
ALTER TABLE "star_entries" ADD CONSTRAINT "star_entries_sign_check" CHECK (
  ("kind" IN ('earn', 'release') AND "stars" > 0)
  OR ("kind" IN ('reserve', 'reverse') AND "stars" < 0)
  OR ("kind" = 'adjust' AND "stars" <> 0)
);

-- Content and people.
ALTER TABLE "events" ADD CONSTRAINT "events_times_check" CHECK ("starts_at" < "ends_at");
ALTER TABLE "events" ADD CONSTRAINT "events_price_check" CHECK ("price_cents" IS NULL OR "price_cents" >= 0);
ALTER TABLE "posts" ADD CONSTRAINT "posts_excerpt_check" CHECK (char_length("excerpt") <= 180);
ALTER TABLE "users" ADD CONSTRAINT "users_birth_month_check" CHECK ("birth_month" BETWEEN 1 AND 12);
