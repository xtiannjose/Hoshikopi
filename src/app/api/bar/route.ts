import { connection } from "next/server";

import { now } from "@/lib/clock";
import { requireStaff } from "@/modules/identity";
import { barBoard } from "@/modules/ordering";

/**
 * The Bar Screen polls this every 3 seconds with the version it has; an
 * unchanged board answers in a few bytes (ADR 0009).
 */
export async function GET(request: Request) {
  await connection();
  await requireStaff("barista", "/bar");
  const board = await barBoard(now());
  const seen = new URL(request.url).searchParams.get("v");
  return Response.json(board.version === seen ? { same: true } : board, {
    headers: { "Cache-Control": "no-store" },
  });
}
