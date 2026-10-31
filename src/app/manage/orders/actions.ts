"use server";

import { refresh } from "next/cache";

import { requireStaff } from "@/modules/identity";
import { cancelOrder, refundOrder } from "@/modules/ordering";

const managerActor = async () => {
  const staff = await requireStaff("manager", "/manage/orders");
  return { kind: "staff" as const, id: staff.id, role: staff.role };
};

/** A full Refund from the Manager's day view (PAY-05, STAFF-07). */
export async function refundAction(form: FormData) {
  await refundOrder(String(form.get("id") ?? ""), await managerActor());
  refresh();
}

export async function cancelAction(form: FormData) {
  await cancelOrder(
    String(form.get("id") ?? ""),
    await managerActor(),
    String(form.get("reason") ?? "")
  );
  refresh();
}
