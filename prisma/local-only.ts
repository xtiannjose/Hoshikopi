/**
 * Database commands run on a developer's computer (migrate, reset, seed,
 * studio) reach only the database on that computer, unless someone asks for
 * a remote one on purpose. `vercel env pull` writes Neon's
 * DATABASE_URL_UNPOOLED into .env.local, so without this `npm run db:reset`
 * could wipe the live database after one y/N prompt (audit DC-03). Vercel's
 * own builds (VERCEL is set) migrate the live database as designed.
 */
export function refuseRemoteDatabase(
  url: string,
  env: Record<string, string | undefined> = process.env
) {
  if (!url || env.VERCEL || env.ALLOW_REMOTE_SEED === "1") return;
  const host = url.match(/@([^:/?]+)/)?.[1] ?? "";
  if (host === "localhost" || host === "127.0.0.1") return;
  throw new Error(
    `Refusing to use a database that is not on this computer (${host || "unknown host"}). ` +
      "Point DIRECT_URL and DATABASE_URL at the local database, or set ALLOW_REMOTE_SEED=1 if you mean it."
  );
}
