"use server";

import { requireStaff } from "@/modules/identity";
import { transition } from "@/modules/ordering";

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

/** A Manager cancels with a reason, behind a confirm. */
export async function cancelAtBar(id: string, reason: string) {
  const staff = await requireStaff("manager", "/bar");
  const result = await transition(
    id,
    "cancelled",
    { kind: "staff", id: staff.id, role: staff.role },
    reason
  );
  return result.ok;
}
