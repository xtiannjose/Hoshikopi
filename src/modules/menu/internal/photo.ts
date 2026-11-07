import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";

import { now } from "@/lib/clock";

const MAX_BYTES = 2 * 1024 * 1024;

const CONTENT_TYPE = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

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

export type PhotoResult =
  { ok: true; url: string } | { ok: false; error: string };

/**
 * Saves a Menu Item photo (batch 1.5). On Vercel it goes to the Blob store
 * (batch 5.4): BLOB_STORE_ID with Vercel's OIDC token, or an older store's
 * BLOB_READ_WRITE_TOKEN. Without either, to public/menu/ (local runs).
 */
export async function storeMenuPhoto(
  file: File,
  slug: string
): Promise<PhotoResult> {
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Choose a photo under 2 MB." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type) return { ok: false, error: "Choose a JPEG, PNG or WebP photo." };
  // The slug is not validated yet when the photo is saved, so only these
  // characters reach the name: nothing can land outside menu/.
  const safe =
    slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "menu-item";
  const name = `${safe}-${now().getTime()}.${type}`;

  if (process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`menu/${name}`, Buffer.from(bytes), {
        access: "public",
        contentType: CONTENT_TYPE[type],
      });
      return { ok: true, url: blob.url };
    } catch (error) {
      console.error("[menu] photo not saved to Blob:", error);
      return {
        ok: false,
        error: "We couldn't save the photo. Try again in a moment.",
      };
    }
  }

  const dir = path.join(process.cwd(), "public", "menu");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return { ok: true, url: `/menu/${name}` };
}
