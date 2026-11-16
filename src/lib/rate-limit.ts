import { db } from "@/lib/db";
import { now } from "@/lib/clock";

/**
 * Fixed-window rate limit in Postgres: one atomic upsert per request, so
 * concurrent requests are all counted. One key per thing being protected,
 * such as "link:<email>". True when the request may go ahead.
 */
export async function takeToken(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(
    Math.floor(now().getTime() / windowMs) * windowMs
  );
  const [row] = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count`;
  return row.count <= limit;
}

/**
 * The caller's IP as the host reports it, for per-IP limits.
 * ponytail: trusts the first X-Forwarded-For entry, which Vercel overwrites
 * with the real client IP (the e2e tests set it to get their own buckets).
 * Off Vercel, read the platform's client-IP header or the right-most
 * trusted hop instead (audit ID1-08, SEC1-09).
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Forget rate-limit rows older than a day, each morning: the sign-in keys
 * hold emails and IPs, and a window past is never read again.
 */
export async function pruneRateLimits(at: Date): Promise<number> {
  const { count } = await db.rateLimit.deleteMany({
    where: { windowStart: { lt: new Date(at.getTime() - 24 * 60 * 60_000) } },
  });
  return count;
}
