import { db } from "@/lib/db";
import { deleteMemberCart } from "@/modules/cart";
import { forgetGuest } from "@/modules/content";
import { forgetMember, staffRoleFor } from "@/modules/identity";
import { forgetStars } from "@/modules/loyalty";
import { deidentifyOrders } from "@/modules/ordering";

/**
 * "Delete my account" (ACC-03), all or nothing: a failure part way used to
 * leave some of it behind (audit architecture:9). Identity can't import the
 * other modules without a cycle, so the transaction is opened here.
 */
export async function deleteAccountData(member: {
  id: string;
  email: string;
}): Promise<"deleted" | "staff"> {
  return db.$transaction(async (tx) => {
    // A Staff account stays: another Manager removes the role first (DC-01).
    if (await staffRoleFor(member.id, tx)) return "staff";
    await deidentifyOrders(member.id, tx);
    await forgetStars(member.id, tx);
    await deleteMemberCart(member.id, tx);
    await forgetGuest(member.email, tx);
    await forgetMember(member.id, tx);
    return "deleted";
  });
}
