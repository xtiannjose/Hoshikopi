"use server";

import { redirect } from "next/navigation";

import { requireStaff } from "@/modules/identity";
import { cancelOrder, refundOrder } from "@/modules/ordering";

const managerActor = async () => {
  const staff = await requireStaff("manager", "/manage/orders");
  return { kind: "staff" as const, id: staff.id, role: staff.role };
};

/** Back to the same day with what happened. The page shows fixed copy for
 * `done` and checks the code's shape before it shows the code. */
function backToDay(form: FormData, done: string): never {
  const day = String(form.get("day") ?? "");
  const params = new URLSearchParams({
    ...(/^\d{4}-\d{2}-\d{2}$/.test(day) && { day }),
    done,
    code: String(form.get("code") ?? ""),
  });
  redirect(`/manage/orders?${params}`);
}

/** A full Refund from the Manager's day view (PAY-05, STAFF-07). */
export async function refundAction(form: FormData) {
  const result = await refundOrder(
    String(form.get("id") ?? ""),
    await managerActor()
  );
  backToDay(
    form,
    result.ok
      ? "refunded"
      : result.reason === "provider_failed"
        ? "failed"
        : "not_allowed"
  );
}

export async function cancelAction(form: FormData) {
  const result = await cancelOrder(
    String(form.get("id") ?? ""),
    await managerActor(),
    String(form.get("reason") ?? "")
  );
  // Its own outcomes: a refused cancel used to say "can't be refunded"
  // (audit staff:7).
  backToDay(
    form,
    result.ok
      ? "cancelled"
      : result.reason === "reason_required"
        ? "cancel_reason"
        : "cancel_not_allowed"
  );
}
