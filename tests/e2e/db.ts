import { Client } from "pg";

/** Runs one statement against the e2e database. */
export async function e2eQuery(sql: string, values: unknown[] = []) {
  const db = new Client({ connectionString: process.env.E2E_DATABASE_URL });
  await db.connect();
  try {
    return await db.query(sql, values);
  } finally {
    await db.end();
  }
}

/**
 * The server reads the real clock, so tests that order open the cafe all
 * day today (Manila) with Special Hours. Fails only from 23:45 Manila time.
 */
export async function openAllDayToday() {
  const today = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
  await e2eQuery(
    `INSERT INTO special_hours (day, is_closed, opens_at, last_order_at, closes_at, note, updated_at)
     VALUES ($1, false, '00:00', '23:45', '23:59', 'Open all day for tests', now())
     ON CONFLICT (day) DO NOTHING`,
    [today]
  );
  // Every e2e Order comes from one IP, so reset the checkout limits.
  await e2eQuery("DELETE FROM rate_limits WHERE key LIKE 'checkout%'");
  // Parallel specs order into the same windows; room for all of them, so
  // only the test that fills a window on purpose ever sees one full.
  await e2eQuery(
    "UPDATE capacity_rules SET drinks_per_window = 200, food_per_window = 200"
  );
}
