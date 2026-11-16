import { readdir, rm } from "node:fs/promises";
import path from "node:path";

import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  LOCAL_PHOTO_DIR,
  readMenuPhoto,
  removeMenuPhoto,
  storeMenuPhoto,
  type CheckedPhoto,
} from "./photo";

vi.mock("@vercel/blob", () => ({ put: vi.fn(), del: vi.fn() }));

const pngBytes = () =>
  sharp({
    create: { width: 2, height: 2, channels: 3, background: "#e7a83f" },
  })
    .png()
    .toBuffer();

const checkedPng = async (): Promise<CheckedPhoto> => ({
  bytes: await pngBytes(),
  type: "png",
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(put).mockReset();
  vi.mocked(del).mockReset();
});

describe("readMenuPhoto (audit ops:15)", () => {
  it("refuses a file that is not a JPEG, PNG or WebP, whatever its name", async () => {
    expect(await readMenuPhoto(new File(["GIF89a"], "x.png"))).toEqual({
      ok: false,
      error: "Choose a JPEG, PNG or WebP photo.",
    });
  });

  it("refuses a photo over 2 MB", async () => {
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "x.jpg");
    expect(await readMenuPhoto(big)).toEqual({
      ok: false,
      error: "Choose a photo under 2 MB.",
    });
  });

  // A phone photo's EXIF can hold where it was taken; the upload kept it.
  it("re-encodes the photo without its metadata", async () => {
    const tagged = await sharp({
      create: { width: 4, height: 4, channels: 3, background: "#123456" },
    })
      .jpeg()
      .withExif({ IFD0: { Copyright: "Taken at home, 14.58 N 121.06 E" } })
      .toBuffer();
    expect(tagged.includes("Taken at home")).toBe(true);
    const result = await readMenuPhoto(new File([tagged], "phone.jpg"));
    expect(result).toMatchObject({ ok: true, type: "jpg" });
    const bytes = result.ok ? result.bytes : Buffer.alloc(0);
    expect(bytes.includes("Taken at home")).toBe(false);
    expect((await sharp(bytes).metadata()).exif).toBeUndefined();
  });
});

describe("storeMenuPhoto (batch 1.5, 5.4)", () => {
  // public/ is listed only when `next start` begins, so a photo saved
  // there was a 404 until a restart (audit PERF-04).
  it("saves to data/menu-photos/ under a clean name, served by /menu-photos/", async () => {
    vi.stubEnv("BLOB_STORE_ID", "");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    const result = await storeMenuPhoto(
      await checkedPng(),
      "../../Hoshi Latte!"
    );
    expect(result).toMatchObject({ ok: true });
    const url = result.ok ? result.url : "";
    expect(url).toMatch(/^\/menu-photos\/hoshi-latte-\d+\.png$/);
    expect(await readdir(LOCAL_PHOTO_DIR)).toContain(path.basename(url));
    await rm(path.join(LOCAL_PHOTO_DIR, path.basename(url)));
    expect(put).not.toHaveBeenCalled();
  });

  it("uploads to the Blob store when BLOB_STORE_ID is set (Vercel OIDC)", async () => {
    vi.stubEnv("BLOB_STORE_ID", "store_test");
    vi.mocked(put).mockImplementation(
      async (pathname) =>
        ({
          url: `https://store.public.blob.vercel-storage.com/${pathname}`,
        }) as Awaited<ReturnType<typeof put>>
    );
    const result = await storeMenuPhoto(await checkedPng(), "hoshi-latte");
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^menu\/hoshi-latte-\d+\.png$/),
      expect.anything(),
      expect.objectContaining({ access: "public", contentType: "image/png" })
    );
    expect(result).toMatchObject({
      ok: true,
      url: expect.stringMatching(
        /^https:\/\/store\.public\.blob\.vercel-storage\.com\/menu\/hoshi-latte-\d+\.png$/
      ),
    });
  });

  it("tells the Manager when the Blob store refuses the photo", async () => {
    vi.stubEnv("BLOB_STORE_ID", "store_test");
    vi.mocked(put).mockRejectedValue(new Error("Access denied"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await storeMenuPhoto(await checkedPng(), "hoshi-latte")).toEqual({
      ok: false,
      error: "We couldn't save the photo. Try again in a moment.",
    });
  });
});

describe("removeMenuPhoto (audit ops:15)", () => {
  it("deletes a replaced Blob photo, and leaves other addresses alone", async () => {
    const old = "https://store.public.blob.vercel-storage.com/menu/a-1.png";
    await removeMenuPhoto(old);
    expect(del).toHaveBeenCalledWith(old);
    vi.mocked(del).mockReset();
    await removeMenuPhoto("https://example.com/menu/a-1.png");
    await removeMenuPhoto("/menu/seeded.png");
    expect(del).not.toHaveBeenCalled();
  });
});
