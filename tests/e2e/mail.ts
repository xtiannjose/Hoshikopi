import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The e2e server's outbox (MAIL_DIR in playwright.config.ts). reset-db.mts
 * empties it before each run, so a test only finds this run's emails.
 */
export const E2E_MAIL_DIR = path.join(process.cwd(), "data", "mail-e2e");

/** Every email the e2e server wrote to `address` this run. */
export async function mailTo(address: string): Promise<string[]> {
  // The outbox names each file after the address (outbox.ts).
  const ending = `-${address.replace(/[^\w@.+-]/g, "_")}.txt`;
  const files = (await readdir(E2E_MAIL_DIR).catch(() => [])).filter((f) =>
    f.endsWith(ending)
  );
  return Promise.all(
    files.map((f) => readFile(path.join(E2E_MAIL_DIR, f), "utf8"))
  );
}
