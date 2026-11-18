import type { MetadataRoute } from "next";

/**
 * /robots.txt was the "Page not found" page (audit CK-05). It lets crawlers
 * in on purpose: every page says noindex (layout.tsx, ADR 0006), and a
 * crawler must fetch a page to read that. Blocking them here would let a
 * linked address show in search without its page.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" } };
}
