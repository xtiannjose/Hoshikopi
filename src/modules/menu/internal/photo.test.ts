import { readdir, rm } from "node:fs/promises";
import path from "node:path";

import { put } from "@vercel/blob";
import { afterEach, describe, expect, it, vi } from "vitest";

import { storeMenuPhoto } from "./photo";

vi.mock("@vercel/blob", () => ({ put: vi.fn() }));

// The first bytes of a PNG are enough: the type is read from them.
const png = () =>
  new File(
    [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    "x.png"
  );

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(put).mockReset();
});

describe("storeMenuPhoto (batch 1.5, 5.4)", () => {
  it("saves to public/menu/ under a clean name when there is no Blob store", async () => {
    vi.stubEnv("BLOB_STORE_ID", "");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    const result = await storeMenuPhoto(png(), "../../Hoshi Latte!");
    expect(result).toMatchObject({ ok: true });
    const url = result.ok ? result.url : "";
    expect(url).toMatch(/^\/menu\/hoshi-latte-\d+\.png$/);
    const dir = path.join(process.cwd(), "public", "menu");
    expect(await readdir(dir)).toContain(path.basename(url));
    await rm(path.join(dir, path.basename(url)));
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
    const result = await storeMenuPhoto(png(), "hoshi-latte");
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
    expect(await storeMenuPhoto(png(), "hoshi-latte")).toEqual({
      ok: false,
      error: "We couldn't save the photo. Try again in a moment.",
    });
  });
});
