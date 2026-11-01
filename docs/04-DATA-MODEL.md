# Data Model

Status: draft v0.1, 2026-10-30. The tables behind `docs/03-ARCHITECTURE.md`, in PostgreSQL through Prisma ([ADR 0004](adr/0004-postgres-prisma-neon.md)). The Prisma schema in Phase 0 follows this document; when they disagree, fix one in the same change.

## 1. Conventions

- Table and column names in `snake_case`; Prisma models in `PascalCase` with `@@map` and `@map`.
- Ids are `cuid` strings, except settings singletons, natural keys noted below, and `orders.id`, a random UUID made before insert so the status-link token (an HMAC of the id) can be stored as its hash in the same insert.
- Money columns end in `_cents` and are integers, VAT included ([ADR 0002](adr/0002-money-as-integer-centavos.md)).
- Times are `timestamptz` stored in UTC. `service_day` (a `date`) is the cafe's Manila calendar day. Opening times are `time` values in Manila time.
- Every table has `created_at`; editable tables also have `updated_at`.
- Each table belongs to one module (column "Module"); only that module reads or writes it.

## 2. Entity overview

```
categories 1──* menu_items *──* option_groups 1──* options
                    │
carts 1──* cart_lines (choices only, no prices)

orders 1──* order_lines (snapshots)        orders 1──* order_events (append-only)
   │  1──0..1 payments 1──* refunds        payment_events (dedupe of webhooks)
   │──> pickup_window_usage (counts per 15-minute window)
   └──> users (Member, optional)  1──* star_entries (ledger)

opening_hours, special_hours, capacity_rules, cafe_settings, inquiries (V1) (cafe)
events, posts, recurring_events (V1) (content)        users, sessions, accounts, verifications (Better Auth); two_factors (identity, ADR 0014)
audit_log, rate_limits (identity)
```

## 3. Tables

### Menu (module `menu`)

| Table | Columns | Notes |
| --- | --- | --- |
| `categories` | `id`, `slug` unique, `name`, `sort` int, `is_hidden` bool | Coffee, Non-coffee, Tea, Pastries, All-day food, Beans and merch |
| `menu_items` | `id`, `category_id` FK, `slug` unique, `name`, `description`, `base_cents` int ≥ 0, `is_drink` bool, `badges` text[] (`new`, `best_seller`, `barista_pick` (Day), `night_pick`, `vegan`, `no_caffeine`; at most three of each pick), `allergens` text[] (`milk`, `egg`, `wheat`, `soy`, `peanuts`, `tree_nuts`, `fish`, `shellfish`, `sesame`), `photo_url`, `photo_alt`, `sold_out_on` date null, `is_hidden` bool, `sort` int, `pairing_id` FK menu_items null (set null on delete; MENU-08) | `sold_out_on = service_day` means Sold Out today; it clears itself the next day. Home shows the current palette's picks by `sort`: `barista_pick` by day, `night_pick` by night (INFO-13). The "contains nuts" badge shows when `allergens` has `peanuts` or `tree_nuts` (MENU-07). V1 adds `available_until` date null: Hidden after that day (MENU-06); `pairs_with_id` FK null (MENU-08); and `barista_pick` splits into `pick_day` and `pick_night` (INFO-13) |
| `option_groups` | `id`, `name` (Size, Milk, Sugar Level, Ice Level, Extra Shots, Add-ons), `min_select` int ≥ 0, `max_select` int ≥ `min_select`, `sort` | Shared by many Menu Items |
| `menu_item_option_groups` | `menu_item_id` FK, `option_group_id` FK, `sort`; PK both | Which groups a Menu Item offers |
| `options` | `id`, `option_group_id` FK, `name`, `delta_cents` int ≥ 0, `is_default` bool, `adds_allergens` text[] (same values as `menu_items.allergens`), `sold_out_on` date null, `sort` | At most one default per single-choice group. Almond milk adds `tree_nuts` |

### Cafe (module `cafe`)

| Table | Columns | Notes |
| --- | --- | --- |
| `opening_hours` | `weekday` smallint 0 to 6 (PK), `opens_at` time, `last_order_at` time, `closes_at` time, `is_closed` bool | Manila time |
| `special_hours` | `day` date (PK), `is_closed` bool, `opens_at`, `last_order_at`, `closes_at` (null when closed), `note` | Overrides one day |
| `capacity_rules` | `weekday` (PK), `drinks_per_window` int, `food_per_window` int | Per 15-minute Pickup Window |
| `cafe_settings` | `id` = 1, `ordering_paused_until` timestamptz null, `pause_message`, `prep_base_minutes` numeric, `prep_per_drink_minutes` numeric, `order_code_prefix` text; details: `area` text ("Kapitolyo, Pasig"), `map_lat` and `map_lng` numeric(8,5), `directions_md`, `contact_email`, `space_md`, `story_md`; Amenities: `wifi`, `power_outlets`, `pets_allowed`, `smoking_allowed`, `restroom`, `step_free_entrance`, `accessible_restroom` (bool null each), `laptop_note`, `pets_note`, `parking_note` (text null each) | Singleton row. No street, house number or phone (PRD section 2). A null Amenity is unknown and left off the page |
| `inquiries` (V1) | `id`, `kind` enum (`private_event`, `large_order`), `name`, `email`, `wanted_on` date null, `guests` int null, `message` text ≤ 1000, `status` enum (`new`, `answered`, `closed`) | INFO-11; rate limited per IP |

### Cart (module `cart`)

| Table | Columns | Notes |
| --- | --- | --- |
| `carts` | `id`, `guest_token_hash` unique null, `member_id` unique null FK, `updated_at` | Exactly one of the two owners is set |
| `cart_lines` | `id`, `cart_id` FK, `menu_item_id` FK, `option_ids` text[] (sorted), `quantity` int 1 to 20, `note` text ≤ 140, `choice_key` text; unique (`cart_id`, `choice_key`) | `choice_key` = item + sorted Options + note, so identical choices merge |
| `favourites` (V1, cart) | `id`, `member_id` FK users (cascade), `menu_item_id` FK (cascade), `option_ids` text[] (sorted), `choice_key` text, `created_at`; unique (`member_id`, `choice_key`) | ORD-11; at most 20 per Member; priced today when shown or added; deleted with the Member's Cart on account deletion |

### Ordering (module `ordering`)

| Table | Columns | Notes |
| --- | --- | --- |
| `orders` | `id`, `service_day` date, `code` text, `status` enum, `member_id` FK null, `customer_name`, `customer_email` null, `customer_phone` null, `pickup_kind` enum (`asap`, `scheduled`), `window_start` timestamptz, `payment_method` enum (`gcash`, `maya`, `card`, `pay_at_pickup`), `total_cents` int, `reward_stars` int default 0, `access_token_hash`, `paid_at_counter` bool, `cancel_reason` null, status timestamps (`placed_at`, `paid_at`, `accepted_at`, `ready_at`, `picked_up_at`, `cancelled_at`); unique (`service_day`, `code`) | Email or phone is required (check constraint) |
| `order_lines` | `id`, `order_id` FK, `menu_item_id` FK null, `name` (snapshot), `options` jsonb (snapshot: group, name, `delta_cents`), `option_ids` text[] (for Order again, V1), `unit_cents`, `quantity`, `line_cents`, `is_drink` bool, `is_reward` bool, `note` | Never changes after placement |
| `order_events` | `id`, `order_id` FK, `from_status` null, `to_status`, `actor_kind` enum (`customer`, `staff`, `system`, `webhook`), `actor_id` null, `reason` null, `at` | Append-only history |
| `pickup_window_usage` | `window_start` timestamptz (PK), `service_day` date, `drinks` int, `food` int | Locked and updated in `placeOrder` and when an Order closes |
| `order_code_counters` | `service_day` date (PK), `last_number` int | Next code `K-043` by `UPDATE ... RETURNING` |

### Payments (module `payments`)

| Table | Columns | Notes |
| --- | --- | --- |
| `payments` | `id`, `order_id` FK unique, `provider` (`paymongo`, `fake`), `provider_checkout_id`, `provider_payment_id` null, `checkout_url`, `method`, `amount_cents`, `status` enum (`pending`, `paid`, `failed`, `expired`, `refunded`) | One online Payment per Order in the MVP |
| `payment_events` | `id`, `provider`, `provider_event_id`, `type`, `payload` jsonb, `received_at`; unique (`provider`, `provider_event_id`) | Webhook dedupe |
| `refunds` | `id`, `payment_id` FK, `provider_refund_id`, `amount_cents`, `reason`, `actor_id`, `created_at` | Full refunds only in the MVP |

### Loyalty (module `loyalty`)

| Table | Columns | Notes |
| --- | --- | --- |
| `star_entries` | `id`, `member_id` FK, `order_id` FK null, `kind` enum (`earn`, `reserve`, `release`, `reverse`, `adjust`, `birthday` (+9 once a year, LOY-04)), `stars` int (signed), `reason` null, `actor_id` null, `created_at`; index (`member_id`) | Balance = sum of `stars` |

### Content (module `content`)

| Table | Columns | Notes |
| --- | --- | --- |
| `events` | `id`, `slug` unique, `title`, `starts_at`, `ends_at`, `summary`, `body_md`, `photo_url`, `photo_alt`, `price_cents` null, `signup_url` null, `is_published` | Sign-up with a cap comes in V1 (EVT-02) |
| `posts` | `id`, `slug` unique, `title`, `excerpt` ≤ 180, `body_md`, `cover_url`, `cover_alt`, `published_at` null, `author_id` FK | Unpublished while `published_at` is null |
| `recurring_events` (V1) | `id`, `title`, `weekday` smallint 0 to 6, `starts_at` time, `ends_at` time, `note` null, `sort`, `is_published` | EVT-03; Manila time; no sign-up and no structured data |

### Identity (module `identity`)

| Table | Columns | Notes |
| --- | --- | --- |
| `users` (Better Auth) | Better Auth columns plus `role` enum (`customer`, `barista`, `manager`), `birth_month` smallint null, `marketing_opt_in` bool, `deleted_at` null | A Member is a `customer`; Staff have the other roles |
| `sessions`, `accounts`, `verifications` | As Better Auth defines them; `sessions` adds `second_factor_at` timestamptz null | Generated by the Better Auth CLI; `second_factor_at` is ours (ADR 0014) |
| `two_factors` | `user_id` PK FK users (cascade), `secret` text (encrypted with `BETTER_AUTH_SECRET`), `confirmed_at` timestamptz null, `created_at` | Staff Second Factor; pending until the first code matches (ADR 0014) |
| `audit_log` | `id`, `actor_id`, `action`, `target_type`, `target_id`, `data` jsonb, `at` | Every Staff write |
| `rate_limits` | `key`, `window_start`, `count`; PK (`key`, `window_start`) | Postgres-backed limiter, as in Hoshimono |

## 4. Invariants the schema and code must enforce

1. Prices are non-negative: `base_cents ≥ 0`, `delta_cents ≥ 0` (check constraints).
2. `orders.total_cents` equals the sum of its `order_lines.line_cents`, and `line_cents = unit_cents × quantity` (enforced in `placeOrder`; covered by a test).
3. An Order has at most one Payment, and a `paid` Payment only for an Order in `paid` or later.
4. `payment_events` is unique per (`provider`, `provider_event_id`): a repeated webhook changes nothing.
5. A Member's Star balance never goes below zero: reservation checks it inside the transaction that writes the entry, with the Member row locked.
6. `order_events` rows are never updated or deleted.
7. `pickup_window_usage` never exceeds the Capacity in force when the Order was placed (checked under a row lock).
8. (`service_day`, `code`) is unique: two Orders never share a code on the same day.
9. A Cart has exactly one owner (Guest token or Member), never both.

## 5. Seed data (Phase 0 deliverable)

All names, prices and photos are invented for the concept (Concept Notice). Example rows:

| Category | Menu Items (Base Price, PHP) |
| --- | --- |
| Coffee | Kopi Hitam (black, 120), Hoshi Latte (signature: muscovado and sea-salt cream, 185), Spanish Latte (165), Ube Latte (180), Cafe Mocha (175), Cold Brew (150) |
| Non-coffee | Matcha Latte (175), Tablea Tsokolate (160), Calamansi Honey Soda (120) |
| Tea | Barako Chai (150), Tanglad Ginger Tea (120) |
| Pastries | Ube Pandesal (75), Ensaymada (95), Butter Croissant (110), Banana Bread slice (90) |
| All-day food | Tapa Rice Bowl (260), Longganisa Pandesal Sandwich (195) |
| Beans and merch | House Blend 250 g (520), Hoshikopi Tumbler (650) |

Option Groups: Size (Regular +0, Large +30), Milk (Whole +0, Oat +35, Almond +35), Sugar Level (0%, 25%, 50%, 75%, 100%), Ice Level (Less, Normal, Extra), Extra Shots (0 to 2, +35 each), Add-ons (Sea-salt cream +30, Sago +20).

Barista Pick badge on Hoshi Latte, Tablea Tsokolate and Ube Pandesal. Allergens on every seeded Menu Item (for example Hoshi Latte: milk; Ube Pandesal: wheat, milk, egg).

Also seeded: Opening Hours 7:00 to 21:00 (last order 20:30) every day, Capacity 12 drinks and 8 food Lines per window, the cafe's details and Amenities (invented, `area` Kapitolyo, Pasig, map pin on a public spot), two Events, three Posts, and in dev and test only: one Manager (Christian, `seed-manager`), one Barista (Annika, `seed-barista`) and one Member (Hoshi, `seed-member`); their emails are in `docs/06-SETUP.md` section 6.

## 6. Migration policy

- Prisma Migrate; one migration per change, named for what it does.
- Never edit an applied migration; add a new one.
- Destructive changes (dropping or renaming a column with data) go in two steps: add and backfill, then drop in a later migration.
- Seed data loads on dev and test databases only.
