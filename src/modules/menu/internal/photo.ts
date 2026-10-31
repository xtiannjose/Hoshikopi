import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { now } from "@/lib/clock";

const MAX_BYTES = 2 * 1024 * 1024;

/** The real type from the first bytes; the file name and MIME are not trusted. */
function imageType(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
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
 * Saves a Menu Item photo to public/menu/ (batch 1.5). shortcut: local files
 * only work on a writable disk; move to Vercel Blob with the demo deploy
 * (batch 5.4, docs/03 section 14).
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
  const name = `${slug}-${now().getTime()}.${type}`;
  const dir = path.join(process.cwd(), "public", "menu");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return { ok: true, url: `/menu/${name}` };
}
