import type { Prisma } from "@/generated/prisma/client";

/** One Option as an Order Line keeps it at placement (audit architecture:20). */
export type OrderLineOption = {
  group: string;
  name: string;
  deltaCents: number;
};

/**
 * The Order Line's Options snapshot, read in one place. Its own file, as
 * place.ts already imports emails.ts (audit architecture:20).
 */
export const snapshotOptions = (json: Prisma.JsonValue) =>
  (Array.isArray(json) ? json : []) as OrderLineOption[];
