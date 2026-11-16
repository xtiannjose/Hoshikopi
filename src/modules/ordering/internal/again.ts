import type { OrderLine } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { isPlainText } from "@/lib/text";
import { addLine, type CartOwner } from "@/modules/cart";

/**
 * Order again (ORD-11): a Member's past Order's Lines go back in their Cart,
 * checked and priced today. What can't be added is named, once each. Null
 * when the Order is not this Member's.
 */
export async function orderAgain(
  orderId: string,
  memberId: string
): Promise<{ added: number; skipped: string[] } | null> {
  // No Order id has a NUL; Postgres would refuse it (audit SEC2-10).
  if (!isPlainText(orderId)) return null;
  const order = await db.order.findFirst({
    where: { id: orderId, memberId },
    include: { lines: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return null;
  return putLinesBack(order.lines, { memberId });
}

/**
 * An Order's Lines back in a Cart, checked and priced today; what can't be
 * added is named, once each. A Reward Line joins the paid Line it came from.
 */
export async function putLinesBack(
  lines: OrderLine[],
  owner: CartOwner
): Promise<{ added: number; skipped: string[] }> {
  let added = 0;
  const skipped = new Set<string>();
  for (const line of lines) {
    const result = line.menuItemId
      ? await addLine(owner, {
          menuItemId: line.menuItemId,
          optionIds: line.optionIds,
          quantity: line.quantity,
          note: line.note ?? "",
        })
      : { ok: false };
    if (result.ok) added++;
    else skipped.add(line.name);
  }
  return { added, skipped: [...skipped] };
}
