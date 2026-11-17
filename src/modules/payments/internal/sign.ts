import { createHmac } from "node:crypto";

import { sameSecret } from "@/lib/secret";

export const hmacHex = (secret: string, data: string) =>
  createHmac("sha256", secret).update(data).digest("hex");

/** Constant-time comparison of two hex signatures. */
export const sameSignature = sameSecret;
