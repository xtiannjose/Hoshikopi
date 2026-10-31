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

/** The caller's IP as the host reports it, for per-IP limits. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
