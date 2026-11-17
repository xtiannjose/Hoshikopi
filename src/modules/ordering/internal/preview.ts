import { db } from "@/lib/db";
import { orderingState } from "@/modules/cafe";

import { orderingDay } from "./day";
import { offeredWindows } from "./windows";

export type PickupPreview =
  | { kind: "open"; times: Date[] }
  | { kind: "paused"; until: Date }
  | { kind: "closed" };

/**
 * Home's pickup card (docs/05 section 6, audit UI2-05): the next five
 * Pickup Times for one drink, by the rules checkout uses. Only a preview:
 * the real choice is made at checkout, where Capacity is checked against
 * the Cart. Closed shows nothing here; the open status says when it opens.
 */
export async function nextPickupTimes(at: Date): Promise<PickupPreview> {
  const day = await orderingDay(at);
  const state = orderingState(at, day);
  if (!state.canOrder) {
    return state.reason === "paused"
      ? { kind: "paused", until: state.until }
      : { kind: "closed" };
  }
  const { windows } = await offeredWindows(db, at, day, { drinks: 1, food: 0 });
  return { kind: "open", times: windows.slice(0, 5).map((w) => w.start) };
}
