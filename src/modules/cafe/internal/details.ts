import { cacheLife, cacheTag } from "next/cache";

import { manila, now } from "@/lib/clock";
import { db } from "@/lib/db";
import type { Hours } from "@/lib/hours";

export type CafeContact = { area: string; contactEmail: string };

export type Amenities = {
  wifi: boolean | null;
  powerOutlets: boolean | null;
  petsAllowed: boolean | null;
  smokingAllowed: boolean | null;
  restroom: boolean | null;
  stepFreeEntrance: boolean | null;
  accessibleRestroom: boolean | null;
  laptopNote: string | null;
  petsNote: string | null;
  parkingNote: string | null;
};

export type CafeDetails = CafeContact &
  Amenities & {
    mapLat: number;
    mapLng: number;
    directionsMd: string;
    spaceMd: string;
    storyMd: string;
  };

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

/** Everything /cafe shows about visiting (INFO-01, INFO-04 to INFO-07). */
export async function getCafeDetails(): Promise<CafeDetails> {
  "use cache";
  cacheTag("hours");
  cacheLife("max");
  const row = await db.cafeSettings.findUniqueOrThrow({ where: { id: 1 } });
  return {
    area: row.area,
    contactEmail: row.contactEmail,
    mapLat: row.mapLat.toNumber(),
    mapLng: row.mapLng.toNumber(),
    directionsMd: row.directionsMd,
    spaceMd: row.spaceMd,
    storyMd: row.storyMd,
    wifi: row.wifi,
    powerOutlets: row.powerOutlets,
    petsAllowed: row.petsAllowed,
    smokingAllowed: row.smokingAllowed,
    restroom: row.restroom,
    stepFreeEntrance: row.stepFreeEntrance,
    accessibleRestroom: row.accessibleRestroom,
    laptopNote: row.laptopNote,
    petsNote: row.petsNote,
    parkingNote: row.parkingNote,
  };
}

// `time` columns come back as 1970-01-01T07:00:00Z.
const hhmm = (time: Date) => time.toISOString().slice(11, 16);

/** Opening Hours and the next four weeks of Special Hours, as plain data. */
export async function getHours(): Promise<Hours> {
  "use cache";
  cacheTag("hours");
  cacheLife("hours");
  const today = manila(now()).day;
  const [weekly, special] = await Promise.all([
    db.openingHours.findMany({ orderBy: { weekday: "asc" } }),
    db.specialHours.findMany({
      where: {
        day: {
          gte: new Date(`${today}T00:00:00Z`),
          lt: new Date(Date.parse(`${today}T00:00:00Z`) + 28 * 86_400_000),
        },
      },
      orderBy: { day: "asc" },
    }),
  ]);
  return {
    weekly: weekly.map((w) => ({
      weekday: w.weekday,
      opensAt: hhmm(w.opensAt),
      lastOrderAt: hhmm(w.lastOrderAt),
      closesAt: hhmm(w.closesAt),
      isClosed: w.isClosed,
    })),
    special: special.map((s) => ({
      day: s.day.toISOString().slice(0, 10),
      isClosed: s.isClosed,
      opensAt: s.opensAt && hhmm(s.opensAt),
      lastOrderAt: s.lastOrderAt && hhmm(s.lastOrderAt),
      closesAt: s.closesAt && hhmm(s.closesAt),
      note: s.note,
    })),
  };
}
