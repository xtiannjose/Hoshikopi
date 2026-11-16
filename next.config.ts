import type { NextConfig } from "next";

import { blobHost } from "./src/lib/blob-host";

const blobHostname = blobHost(process.env);

// ADR 0013: prerendered pages carry Next's inline RSC scripts, which take no
// nonce or hash, so scripts need 'unsafe-inline'; everything else is locked
// to this site. Forms may land on PayMongo's checkout or Google's sign-in.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.paymongo.com https://accounts.google.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // The menu readers revalidate every 10 seconds, so a Staff save that
  // races a cache refill heals fast; an hour's expiry keeps the pages
  // prerendered (5 minutes is the floor) (audit staff:2).
  cacheLife: {
    menu: { stale: 300, revalidate: 10, expire: 3600 },
  },
  cacheComponents: true,
  // Off (7.6): with it on, every page carried its React payload twice (Home
  // 405 kB raw, 50 kB compressed); off, once (258 kB, 34 kB). Links still
  // prefetch, after the page has loaded.
  partialPrefetching: false,
  // Menu photos up to 2 MB go through a Server Action (batch 1.5), which
  // refuses bodies over 1 MB by default. The action checks the role first.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  // Menu photos uploaded on Vercel live in the Blob store (batch 5.4); the
  // image optimizer fetches them, so the pages' CSP stays 'self'.
  images: {
    // This store's photos only, never every Blob store (audit ops:7).
    remotePatterns: blobHostname
      ? [{ protocol: "https", hostname: blobHostname, pathname: "/menu/**" }]
      : [],
  },
  // No page may be framed, sniffed as another type, leak its full address
  // to other sites, or ask for the camera, microphone or location.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
