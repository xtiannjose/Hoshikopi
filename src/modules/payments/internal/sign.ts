import { createHmac, timingSafeEqual } from "node:crypto";

export const hmacHex = (secret: string, data: string) =>
  createHmac("sha256", secret).update(data).digest("hex");

/** Constant-time comparison of two hex signatures. */
export function sameSignature(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}
