/**
 * This project's Blob store host, for next/image's remotePatterns: allowing
 * every store let anyone spend the project's image transformations (audit
 * ops:7). From BLOB_STORE_ID (Vercel's OIDC) or an older store's token
 * (vercel_blob_rw_<store>_<secret>), as @vercel/blob reads them.
 */
export function blobHost(env: Record<string, string | undefined>) {
  const store =
    env.BLOB_STORE_ID?.replace(/^store_/, "") ||
    env.BLOB_READ_WRITE_TOKEN?.split("_")[3];
  return store ? `${store.toLowerCase()}.public.blob.vercel-storage.com` : null;
}
