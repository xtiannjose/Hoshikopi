import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Compare two secrets in constant time, whatever their lengths: hashing
 * first gives equal-length inputs, so neither the content nor the length
 * leaks through how long the check takes (audit SEC2-13, SEC1-21).
 */
export function sameSecret(given: string, expected: string): boolean {
  return timingSafeEqual(digest(given), digest(expected));
}
