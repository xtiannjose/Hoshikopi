import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { del, put } from "@vercel/blob";
import sharp from "sharp";

import { now } from "@/lib/clock";

const MAX_BYTES = 2 * 1024 * 1024;

const CONTENT_TYPE = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

/** Where each kind of photo goes in the Blob store (12.3). */
export type PhotoFolder = "menu" | "events" | "posts";

/**
 * Without a Blob store, every photo (Menu Items, Events, Posts) goes here
 * and /menu-photos/<name> serves it:
 * `next start` lists public/ only when it starts, so a photo saved there was
 * a 404 until a restart (audit PERF-04).
 */
export const LOCAL_PHOTO_DIR = path.join(process.cwd(), "data", "menu-photos");
export const LOCAL_PHOTO_PATH = "/menu-photos/";

/** The real type from the first bytes; the file name and MIME are not trusted. */
function imageType(bytes: Uint8Array): keyof typeof CONTENT_TYPE | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export type CheckedPhoto = { bytes: Buffer; type: keyof typeof CONTENT_TYPE };

/**
 * Checks a photo's size and type, then re-encodes it upright and
 * without its metadata: a phone photo's EXIF can say where it was taken
 * (audit ops:15). Nothing is stored yet.
 */
export async function readPhoto(
  file: File
): Promise<({ ok: true } & CheckedPhoto) | { ok: false; error: string }> {
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Choose a photo under 2 MB." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type) return { ok: false, error: "Choose a JPEG, PNG or WebP photo." };
  try {
    // sharp writes no metadata unless asked; rotate() applies EXIF's
    // orientation first, so the photo stays upright without it.
    return { ok: true, type, bytes: await sharp(bytes).rotate().toBuffer() };
  } catch {
    return { ok: false, error: "We couldn't read that photo. Try another." };
  }
}

export type PhotoResult =
  { ok: true; url: string } | { ok: false; error: string };

/**
 * Saves a checked photo (batch 1.5). On Vercel it goes to the Blob store
 * (batch 5.4): BLOB_STORE_ID with Vercel's OIDC token, or an older store's
 * BLOB_READ_WRITE_TOKEN. Without either, to data/menu-photos/ (local runs).
 */
export async function storePhoto(
  photo: CheckedPhoto,
  folder: PhotoFolder,
  slug: string
): Promise<PhotoResult> {
  // Only these characters reach the name: nothing can land outside its folder.
  const safe =
    slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "photo";
  const name = `${safe}-${now().getTime()}.${photo.type}`;

  if (process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`${folder}/${name}`, photo.bytes, {
        access: "public",
        contentType: CONTENT_TYPE[photo.type],
      });
      return { ok: true, url: blob.url };
    } catch (error) {
      console.error(`[${folder}] photo not saved to Blob:`, error);
      return {
        ok: false,
        error: "We couldn't save the photo. Try again in a moment.",
      };
    }
  }

  await mkdir(LOCAL_PHOTO_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_PHOTO_DIR, name), photo.bytes);
  return { ok: true, url: `${LOCAL_PHOTO_PATH}${name}` };
}

/**
 * Deletes a photo a save replaced, so it no longer sits in the public store
 * (audit ops:15). Anything else, such as a seeded image, is left alone.
 */
export async function removePhoto(url: string): Promise<void> {
  try {
    if (/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(url)) {
      await del(url);
    } else if (url.startsWith(LOCAL_PHOTO_PATH)) {
      await rm(path.join(LOCAL_PHOTO_DIR, path.basename(url)), { force: true });
    }
  } catch (error) {
    // The new photo is saved; an old file left behind is only clutter.
    console.error("[photo] old photo not deleted:", error);
  }
}

/** A stored local photo's bytes and type, for /menu-photos/<name>. */
export function localPhotoFile(name: string) {
  const match = /^[a-z0-9-]+\.(jpg|png|webp)$/.exec(name);
  if (!match) return null;
  return {
    file: path.join(LOCAL_PHOTO_DIR, name),
    contentType: CONTENT_TYPE[match[1] as keyof typeof CONTENT_TYPE],
  };
}
