import { readFile } from "node:fs/promises";

import { connection } from "next/server";

import { localPhotoFile } from "@/modules/menu";

/**
 * Menu Item photos saved without a Blob store (local runs and the e2e
 * server), read at request time: `next start` lists public/ only when it
 * starts (audit PERF-04).
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/menu-photos/[name]">
) {
  await connection();
  const photo = localPhotoFile((await params).name);
  const bytes = photo && (await readFile(photo.file).catch(() => null));
  if (!photo || !bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": photo.contentType,
      // Each upload gets a new name, so a photo never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
