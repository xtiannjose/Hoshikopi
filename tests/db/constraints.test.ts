import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestDb, resetToSeed } from "./helpers";

// Every hand-written CHECK and unique rule in the migrations, so one that is
// loosened or dropped fails a test (audit tests:18), with the NULL cases
// that used to pass (DATA-06) and the once-only Star entries (DATA-04).

const db = createTestDb();
const ITEM = `(SELECT id FROM menu_items WHERE slug = 'hoshi-latte')`;
const LATTE = `WHERE slug = 'hoshi-latte'`;
const OPTION = `WHERE id = (SELECT id FROM options ORDER BY id LIMIT 1)`;
const EVENT = `WHERE id = (SELECT id FROM events ORDER BY id LIMIT 1)`;
const WEEKLY = `WHERE id = (SELECT id FROM recurring_events ORDER BY id LIMIT 1)`;

beforeAll(async () => {
  await resetToSeed(db);
  await db.$executeRawUnsafe(`
    INSERT INTO orders (id, service_day, code, status, member_id, customer_name,
      customer_email, pickup_kind, window_start, payment_method, total_cents,
      access_token_hash, placed_at, updated_at)
    VALUES ('fx-order', '2026-11-16', 'K-001', 'picked_up', 'seed-member',
      'Hoshi', 'hoshi@example.com', 'asap', now(), 'gcash', 18500, 'x', now(), now())`);
  await db.$executeRawUnsafe(`
    INSERT INTO payments (id, order_id, provider, provider_checkout_id,
      checkout_url, method, amount_cents, updated_at)
    VALUES ('fx-pay', 'fx-order', 'fake', 'c1', 'https://example.com', 'gcash', 18500, now())`);
  await db.$executeRawUnsafe(
    `INSERT INTO carts (id, member_id, updated_at) VALUES ('fx-cart', 'seed-member', now())`
  );
  await db.$executeRawUnsafe(`
    INSERT INTO star_entries (id, member_id, order_id, kind, stars, reason) VALUES
      ('fx-earn', 'seed-member', 'fx-order', 'earn', 1, NULL),
      ('fx-bday', 'seed-member', NULL, 'birthday', 9, 'Birthday Treat 2026')`);
});
afterAll(() => db.$disconnect());

const refused: [string, string][] = [
  [
    "menu_items_base_cents_check",
    `UPDATE menu_items SET base_cents = -1 ${LATTE}`,
  ],
  [
    "menu_items_badges_check",
    `UPDATE menu_items SET badges = ARRAY['hot'] ${LATTE}`,
  ],
  [
    "menu_items_allergens_check",
    `UPDATE menu_items SET allergens = ARRAY['gluten'] ${LATTE}`,
  ],
  ["menu_items_arrays_check", `UPDATE menu_items SET badges = NULL ${LATTE}`],
  [
    "menu_items_arrays_check",
    `UPDATE menu_items SET allergens = NULL ${LATTE}`,
  ],
  [
    "menu_items_calorie_kcal_check",
    `UPDATE menu_items SET calorie_kcal = 3001 ${LATTE}`,
  ],
  // A Promo with a NULL price or end passed (DATA-06).
  [
    "menu_items_promo_check",
    `UPDATE menu_items SET promo_cents = NULL, promo_from = '2026-11-01', promo_until = '2026-11-30' ${LATTE}`,
  ],
  [
    "menu_items_promo_check",
    `UPDATE menu_items SET promo_cents = 15000, promo_from = '2026-11-01', promo_until = NULL ${LATTE}`,
  ],
  [
    "menu_items_promo_check",
    `UPDATE menu_items SET promo_cents = base_cents, promo_from = '2026-11-01', promo_until = '2026-11-30' ${LATTE}`,
  ],
  [
    "options_delta_cents_check",
    `UPDATE options SET delta_cents = -1 ${OPTION}`,
  ],
  [
    "options_adds_allergens_check",
    `UPDATE options SET adds_allergens = ARRAY['x'] ${OPTION}`,
  ],
  [
    "options_arrays_check",
    `UPDATE options SET adds_allergens = NULL ${OPTION}`,
  ],
  [
    "option_groups_select_check",
    `UPDATE option_groups SET max_select = 0 WHERE id = (SELECT id FROM option_groups ORDER BY id LIMIT 1)`,
  ],
  [
    "opening_hours_weekday_check",
    `UPDATE opening_hours SET weekday = 7 WHERE weekday = 0`,
  ],
  [
    "opening_hours_times_check",
    `UPDATE opening_hours SET opens_at = '22:00' WHERE weekday = 1`,
  ],
  // An open day with no times passed (DATA-06).
  [
    "special_hours_times_check",
    `INSERT INTO special_hours (day, is_closed, updated_at) VALUES ('2026-12-01', false, now())`,
  ],
  [
    "special_hours_times_check",
    `INSERT INTO special_hours (day, is_closed, opens_at, last_order_at, closes_at, updated_at) VALUES ('2026-12-02', false, '10:00', '09:00', '18:00', now())`,
  ],
  [
    "capacity_rules_weekday_check",
    `UPDATE capacity_rules SET weekday = 9 WHERE weekday = 0`,
  ],
  [
    "capacity_rules_counts_check",
    `UPDATE capacity_rules SET drinks_per_window = -1 WHERE weekday = 0`,
  ],
  ["cafe_settings_singleton_check", `UPDATE cafe_settings SET id = 2`],
  [
    "cafe_settings_busy_minutes_check",
    `UPDATE cafe_settings SET busy_minutes = -1`,
  ],
  [
    "cafe_settings_busy_minutes_check",
    `UPDATE cafe_settings SET busy_minutes = 61`,
  ],
  [
    "carts_one_owner_check",
    `INSERT INTO carts (id, updated_at) VALUES ('fx-nobody', now())`,
  ],
  [
    "cart_lines_quantity_check",
    `INSERT INTO cart_lines (id, cart_id, menu_item_id, quantity, choice_key, option_ids, updated_at) VALUES ('fx-l1', 'fx-cart', ${ITEM}, 21, 'k1', '{}', now())`,
  ],
  [
    "cart_lines_note_check",
    `INSERT INTO cart_lines (id, cart_id, menu_item_id, quantity, note, choice_key, option_ids, updated_at) VALUES ('fx-l2', 'fx-cart', ${ITEM}, 1, repeat('a', 141), 'k2', '{}', now())`,
  ],
  [
    "cart_lines_option_ids_check",
    `INSERT INTO cart_lines (id, cart_id, menu_item_id, quantity, choice_key, option_ids, updated_at) VALUES ('fx-l3', 'fx-cart', ${ITEM}, 1, 'k3', NULL, now())`,
  ],
  [
    "favourites_option_ids_check",
    `INSERT INTO favourites (id, member_id, menu_item_id, option_ids, choice_key) VALUES ('fx-f', 'seed-member', ${ITEM}, NULL, 'k')`,
  ],
  [
    "orders_contact_check",
    `UPDATE orders SET customer_email = NULL, customer_phone = NULL WHERE id = 'fx-order'`,
  ],
  [
    "orders_money_check",
    `UPDATE orders SET total_cents = -1 WHERE id = 'fx-order'`,
  ],
  [
    "order_lines_money_check",
    `INSERT INTO order_lines (id, order_id, name, options, unit_cents, quantity, line_cents, is_drink) VALUES ('fx-ol1', 'fx-order', 'Latte', '[]', 100, 2, 300, true)`,
  ],
  [
    "order_lines_option_ids_check",
    `INSERT INTO order_lines (id, order_id, name, options, unit_cents, quantity, line_cents, is_drink, option_ids) VALUES ('fx-ol2', 'fx-order', 'Latte', '[]', 100, 2, 200, true, NULL)`,
  ],
  [
    "pickup_window_usage_counts_check",
    `INSERT INTO pickup_window_usage (window_start, service_day, drinks, food, updated_at) VALUES (now(), '2026-11-16', -1, 0, now())`,
  ],
  [
    "payments_amount_check",
    `UPDATE payments SET amount_cents = -1 WHERE id = 'fx-pay'`,
  ],
  [
    "refunds_amount_check",
    `INSERT INTO refunds (id, payment_id, provider_refund_id, amount_cents, reason, actor_id) VALUES ('fx-r', 'fx-pay', 'r1', -1, 'x', 'seed-manager')`,
  ],
  [
    "star_entries_sign_check",
    `INSERT INTO star_entries (id, member_id, kind, stars) VALUES ('fx-s0', 'seed-member', 'earn', -1)`,
  ],
  // Once per Order and kind, one Birthday Treat a year (DATA-04).
  [
    "star_entries_once_per_order",
    `INSERT INTO star_entries (id, member_id, order_id, kind, stars) VALUES ('fx-s1', 'seed-member', 'fx-order', 'earn', 1)`,
  ],
  [
    "star_entries_birthday_once",
    `INSERT INTO star_entries (id, member_id, kind, stars, reason) VALUES ('fx-s2', 'seed-member', 'birthday', 9, 'Birthday Treat 2026')`,
  ],
  ["events_times_check", `UPDATE events SET ends_at = starts_at ${EVENT}`],
  ["events_price_check", `UPDATE events SET price_cents = -1 ${EVENT}`],
  ["events_seats_check", `UPDATE events SET seats = 0 ${EVENT}`],
  [
    "event_signups_seats_check",
    `INSERT INTO event_signups (id, event_id, name, email, seats) VALUES ('fx-su', (SELECT id FROM events ORDER BY id LIMIT 1), 'A', 'a@example.com', 5)`,
  ],
  [
    "posts_excerpt_check",
    `UPDATE posts SET excerpt = repeat('a', 181) WHERE id = (SELECT id FROM posts ORDER BY id LIMIT 1)`,
  ],
  [
    "users_birth_month_check",
    `UPDATE users SET birth_month = 13 WHERE id = 'seed-member'`,
  ],
  [
    "recurring_events_weekday_check",
    `UPDATE recurring_events SET weekday = 7 ${WEEKLY}`,
  ],
  [
    "recurring_events_times_check",
    `UPDATE recurring_events SET ends_at = '25:00' ${WEEKLY}`,
  ],
  [
    "inquiries_message_check",
    `INSERT INTO inquiries (id, kind, name, email, message, updated_at) VALUES ('fx-i1', 'large_order', 'A', 'a@example.com', '', now())`,
  ],
  [
    "inquiries_guests_check",
    `INSERT INTO inquiries (id, kind, name, email, message, guests, updated_at) VALUES ('fx-i2', 'large_order', 'A', 'a@example.com', 'Hi', 501, now())`,
  ],
];

describe("database rules (audit tests:18)", () => {
  it.each(refused)("%s refuses: %s", async (rule, sql) => {
    await expect(db.$executeRawUnsafe(sql)).rejects.toThrow(rule);
  });

  it("takes the rows at each boundary", async () => {
    for (const sql of [
      `UPDATE cafe_settings SET busy_minutes = 0`,
      `UPDATE cafe_settings SET busy_minutes = 60`,
      `UPDATE menu_items SET calorie_kcal = 3000 ${LATTE}`,
      `UPDATE menu_items SET promo_cents = base_cents - 1, promo_from = '2026-11-01', promo_until = '2026-11-01' ${LATTE}`,
      `UPDATE menu_items SET promo_cents = NULL, promo_from = NULL, promo_until = NULL ${LATTE}`,
      `UPDATE menu_items SET badges = '{}', allergens = '{}' ${LATTE}`,
      `INSERT INTO special_hours (day, is_closed, updated_at) VALUES ('2026-12-03', true, now())`,
      `INSERT INTO cart_lines (id, cart_id, menu_item_id, quantity, note, choice_key, option_ids, updated_at) VALUES ('fx-ok', 'fx-cart', ${ITEM}, 20, repeat('a', 140), 'k-ok', '{}', now())`,
      `INSERT INTO event_signups (id, event_id, name, email, seats) VALUES ('fx-su-ok', (SELECT id FROM events ORDER BY id LIMIT 1), 'A', 'ok@example.com', 4)`,
      `INSERT INTO inquiries (id, kind, name, email, message, guests, updated_at) VALUES ('fx-i-ok', 'large_order', 'A', 'a@example.com', 'Hi', 500, now())`,
      `UPDATE users SET birth_month = 12 WHERE id = 'seed-member'`,
      // A reserve beside the earn, and next year's Birthday Treat.
      `INSERT INTO star_entries (id, member_id, order_id, kind, stars) VALUES ('fx-res', 'seed-member', 'fx-order', 'reserve', -9)`,
      `INSERT INTO star_entries (id, member_id, kind, stars, reason) VALUES ('fx-bday2', 'seed-member', 'birthday', 9, 'Birthday Treat 2027')`,
    ]) {
      await db.$executeRawUnsafe(sql);
    }
  });
});
