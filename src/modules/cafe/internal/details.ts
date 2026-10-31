import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db";

export type CafeContact = { area: string; contactEmail: string };

/** The neighbourhood and email for the footer and visit block. */
export async function getCafeContact(): Promise<CafeContact> {
  "use cache";
  cacheTag("hours");
  cacheLife("max");
  return db.cafeSettings.findUniqueOrThrow({
    where: { id: 1 },
    select: { area: true, contactEmail: true },
  });
}
