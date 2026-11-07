import { connection } from "next/server";

import { now } from "@/lib/clock";
import { currentStaff } from "@/modules/identity";
import { barBoard } from "@/modules/ordering";

/**
 * The Bar Screen polls this every 3 seconds with the version it has; an
 * unchanged board answers in a few bytes (ADR 0009). Signed out, it answers
 * 401 so the board can say it stopped, not a redirect to the sign-in page.
 */
export async function GET(request: Request) {
  await connection();
  const headers = { "Cache-Control": "no-store" };
  if (!(await currentStaff("barista"))) {
    return Response.json({ signedOut: true }, { status: 401, headers });
  }
  const board = await barBoard(now());
  const seen = new URL(request.url).searchParams.get("v");
  return Response.json(board.version === seen ? { same: true } : board, {
    headers,
  });
}
