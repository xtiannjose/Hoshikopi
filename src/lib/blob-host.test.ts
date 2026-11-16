import { describe, expect, it } from "vitest";

import { blobHost } from "./blob-host";

// next/image allowed every Blob store, so anyone could spend the project's
// image transformations (audit ops:7). Only this store's host is allowed.
describe("blobHost", () => {
  it("is the store's public host, from BLOB_STORE_ID or the old token", () => {
    expect(blobHost({ BLOB_STORE_ID: "store_AbC123" })).toBe(
      "abc123.public.blob.vercel-storage.com"
    );
    expect(
      blobHost({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_Xy9Z_secretpart" })
    ).toBe("xy9z.public.blob.vercel-storage.com");
  });

  it("is null without a store, so no remote host is allowed", () => {
    expect(blobHost({})).toBeNull();
  });
});
