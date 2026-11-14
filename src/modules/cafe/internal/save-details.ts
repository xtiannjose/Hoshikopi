import { z } from "zod";

import { db } from "@/lib/db";
import { audit, type Staff } from "@/modules/identity";

const triState = z
  .enum(["yes", "no", "unknown"])
  .transform((v) => (v === "unknown" ? null : v === "yes"));
const note = z
  .string()
  .trim()
  .max(200, "Keep it under 200 characters.")
  .transform((v) => v || null);
const markdown = z
  .string()
  .trim()
  .min(1, "Write something here.")
  .max(4000, "Keep it under 4,000 characters.");

// Blank is missing, not 0 (z.coerce turns "" into 0, a pin at 0,0).
const coordinate = (max: number) => {
  const range = `Use a number from -${max} to ${max}.`;
  return z
    .string("Enter the map pin.")
    .trim()
    .min(1, "Enter the map pin.")
    .transform(Number)
    .pipe(z.number(range).min(-max, range).max(max, range));
};

const DetailsInput = z.object({
  area: z.string().trim().min(2, "Enter the neighbourhood.").max(80),
  mapLat: coordinate(90),
  mapLng: coordinate(180),
  contactEmail: z.email("Enter an email address."),
  directionsMd: markdown,
  spaceMd: markdown,
  storyMd: markdown,
  wifi: triState,
  powerOutlets: triState,
  petsAllowed: triState,
  smokingAllowed: triState,
  restroom: triState,
  stepFreeEntrance: triState,
  accessibleRestroom: triState,
  laptopNote: note,
  petsNote: note,
  parkingNote: note,
});

export type DetailsResult =
  { ok: true } | { ok: false; errors: Partial<Record<string, string>> };

/** A Manager edits the cafe's details and Amenities (STAFF-09). */
export async function saveCafeDetails(
  input: Record<string, unknown>,
  actor: Staff
): Promise<DetailsResult> {
  const parsed = DetailsInput.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[String(issue.path[0])] ??= issue.message;
    }
    return { ok: false, errors };
  }
  await db.$transaction(async (tx) => {
    await tx.cafeSettings.update({ where: { id: 1 }, data: parsed.data });
    await audit(
      actor,
      "cafe.details.update",
      { type: "cafe_settings", id: "1" },
      {},
      tx
    );
  });
  return { ok: true };
}
