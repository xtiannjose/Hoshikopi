import { NextResponse, type NextRequest } from "next/server";

import { isPlainText } from "@/lib/text";

/**
 * An address with broken percent-encoding or a NUL gets the site's
 * not-found page (audit SEC2-10). Next answers broken encoding with a 400,
 * but an App Router build has no page to render a 400 (only /500 is a
 * static status page), so it fell to a bare, untitled 500; a NUL failed in
 * Postgres. This runs before Next matches routes, so it covers every route
 * param. Other decode errors inside Next would still give that bare 500.
 */
export function proxy(request: NextRequest) {
  let path = "\u0000";
  try {
    path = decodeURIComponent(request.nextUrl.pathname);
  } catch {
    // Broken percent-encoding: not found, below.
  }
  if (!isPlainText(path)) {
    // A path no route matches, so Next renders its usual 404 in the frame.
    return NextResponse.rewrite(new URL("/_broken-address", request.url));
  }
}

// Only an address with a percent sign can be broken or carry a NUL.
export const config = { matcher: "/(.*%.*)" };
