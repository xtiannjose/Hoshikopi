import { connection } from "next/server";

import { now } from "@/lib/clock";
import { currentStaff } from "@/modules/identity";
import { soldOutStamp } from "@/modules/menu";
import { barBoard } from "@/modules/ordering";

/**
 * The Bar Screen polls this every 3 seconds with the board version and the
 * Sold Out stamp it has; when neither changed it answers in a few bytes
 * (ADR 0009). A new stamp makes the screen refresh its Sold Out panel
 * (audit DC-13). Signed out, it answers 401 so the board can say it
 * stopped, not a redirect to the sign-in page.
 */
export async function GET(request: Request) {
  await connection();
  const headers = { "Cache-Control": "no-store" };
  if (!(await currentStaff("barista"))) {
    return Response.json({ signedOut: true }, { status: 401, headers });
  }
  const at = now();
  const [board, menu] = await Promise.all([barBoard(at), soldOutStamp(at)]);
  const seen = new URL(request.url).searchParams;
  const same = board.version === seen.get("v") && menu === seen.get("m");
  return Response.json(same ? { same: true } : { ...board, menu }, {
    headers,
  });
}
