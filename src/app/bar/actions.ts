"use server";

import { refreshPublic } from "@/lib/refresh";
import { requireStaff } from "@/modules/identity";
import { setMenuItemSoldOut, setOptionSoldOut } from "@/modules/menu";
import { cancelOrder, transition } from "@/modules/ordering";

const NEXT = {
  placed: "accepted",
  paid: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "picked_up",
} as const;

/** One tap moves an Order to its next Order Status (STAFF-02). */
export async function advanceOrder(id: string, from: keyof typeof NEXT) {
  const staff = await requireStaff("barista", "/bar");
  const result = await transition(id, NEXT[from], {
    kind: "staff",
    id: staff.id,
    role: staff.role,
  });
  return result.ok;
}

/**
 * A Manager cancels with a reason, behind a confirm. A cancel can refund, so
 * it needs the Second Factor: requireStaff asks for it at Manager level and
 * brings them back to the Bar Screen (ADR 0014).
 */
export async function cancelAtBar(id: string, reason: string) {
  const staff = await requireStaff("manager", "/bar");
  const result = await cancelOrder(
    id,
    { kind: "staff", id: staff.id, role: staff.role },
    reason
  );
  return result.ok;
}

/**
 * Sold Out today or back on, from the Bar Screen and /manage/menu: no
 * Second Factor, like the bar's other taps, so a Barista who never set up
 * an authenticator can do it (STAFF-03, audit staff:8). Signed out, it
 * goes to sign-in and back to the Bar Screen.
 */
export async function toggleSoldOut(form: FormData) {
  const staff = await requireStaff("barista", "/bar");
  const field = (name: string) => String(form.get(name) ?? "");
  const soldOut = field("soldOut") === "1";
  if (field("kind") === "option") {
    await setOptionSoldOut(field("id"), soldOut, staff);
  } else {
    await setMenuItemSoldOut(field("id"), soldOut, staff);
  }
  refreshPublic("menu");
}
