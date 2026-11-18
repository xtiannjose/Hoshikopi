import { readdir, rm } from "node:fs/promises";
import path from "node:path";

import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  LOCAL_PHOTO_DIR,
  readPhoto,
  removePhoto,
  storePhoto,
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

describe("readPhoto (audit ops:15)", () => {
  it("refuses a file that is not a JPEG, PNG or WebP, whatever its name", async () => {
    expect(await readPhoto(new File(["GIF89a"], "x.png"))).toEqual({
      ok: false,
      error: "Choose a JPEG, PNG or WebP photo.",
    });
  });

  // The type comes from the first bytes, so an SVG never passes as an image
  // (audit SEC1-20).
  it("refuses an SVG, even named and typed as a PNG (audit SEC1-20)", async () => {
    const svg = new File(
      [
        '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      ],
      "x.png",
      { type: "image/png" }
    );
    expect(await readPhoto(svg)).toEqual({
      ok: false,
      error: "Choose a JPEG, PNG or WebP photo.",
    });
  });

  it("refuses a photo over 2 MB", async () => {
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "x.jpg");
    expect(await readPhoto(big)).toEqual({
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
    const result = await readPhoto(new File([tagged], "phone.jpg"));
    expect(result).toMatchObject({ ok: true, type: "jpg" });
    const bytes = result.ok ? result.bytes : Buffer.alloc(0);
    expect(bytes.includes("Taken at home")).toBe(false);
    expect((await sharp(bytes).metadata()).exif).toBeUndefined();
  });
});

// A 2 MB file could unpack to 268 million pixels, about 1 GB of memory, and
// photos were stored at whatever size they came (audit CK-03).
describe("readPhoto, the size it unpacks to (audit CK-03)", () => {
  it("shrinks a photo to 2400 px on its long side, and leaves a small one", async () => {
    const wide = await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: "#e7a83f" },
    })
      .jpeg()
      .toBuffer();
    const result = await readPhoto(new File([wide], "wide.jpg"));
    if (!result.ok) throw new Error(result.error);
    const shrunk = await sharp(result.bytes).metadata();
    expect([shrunk.width, shrunk.height]).toEqual([2400, 1600]);

    const small = await readPhoto(new File([await pngBytes()], "small.png"));
    if (!small.ok) throw new Error(small.error);
    expect((await sharp(small.bytes).metadata()).width).toBe(2);
  });

  it("refuses a photo of more than 40 million pixels, before unpacking it", async () => {
    const huge = await sharp({
      create: { width: 7000, height: 6000, channels: 3, background: "#ffffff" },
    })
      .png({ palette: true })
      .toBuffer();
    expect(await readPhoto(new File([huge], "huge.png"))).toEqual({
      ok: false,
      error: "Choose a photo under 40 megapixels.",
    });
  });
});

describe("storePhoto (batch 1.5, 5.4)", () => {
  // public/ is listed only when `next start` begins, so a photo saved
  // there was a 404 until a restart (audit PERF-04).
  it("saves to data/menu-photos/ under a clean name, served by /menu-photos/", async () => {
    vi.stubEnv("BLOB_STORE_ID", "");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    const result = await storePhoto(
      await checkedPng(),
      "menu",
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
    const result = await storePhoto(await checkedPng(), "menu", "hoshi-latte");
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

  it("keeps Event and Post photos in their own Blob folders (12.3)", async () => {
    vi.stubEnv("BLOB_STORE_ID", "store_test");
    vi.mocked(put).mockResolvedValue({
      url: "https://store.public.blob.vercel-storage.com/x",
    } as Awaited<ReturnType<typeof put>>);
    await storePhoto(await checkedPng(), "events", "latte-art-night");
    await storePhoto(await checkedPng(), "posts", "new-beans");
    expect(vi.mocked(put).mock.calls.map(([pathname]) => pathname)).toEqual([
      expect.stringMatching(/^events\/latte-art-night-\d+\.png$/),
      expect.stringMatching(/^posts\/new-beans-\d+\.png$/),
    ]);
  });

  it("tells the Manager when the Blob store refuses the photo", async () => {
    vi.stubEnv("BLOB_STORE_ID", "store_test");
    vi.mocked(put).mockRejectedValue(new Error("Access denied"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await storePhoto(await checkedPng(), "menu", "hoshi-latte")).toEqual(
      {
        ok: false,
        error: "We couldn't save the photo. Try again in a moment.",
      }
    );
  });
});

describe("removePhoto (audit ops:15)", () => {
  it("deletes a replaced Blob photo, and leaves other addresses alone", async () => {
    const old = "https://store.public.blob.vercel-storage.com/menu/a-1.png";
    await removePhoto(old);
    expect(del).toHaveBeenCalledWith(old);
    vi.mocked(del).mockReset();
    await removePhoto("https://example.com/menu/a-1.png");
    await removePhoto("/menu/seeded.png");
    expect(del).not.toHaveBeenCalled();
  });
});
