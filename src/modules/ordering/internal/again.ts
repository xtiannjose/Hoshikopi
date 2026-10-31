import { db } from "@/lib/db";
import { addLine } from "@/modules/cart";

/**
 * Order again (ORD-11): a Member's past Order's Lines go back in their Cart,
 * checked and priced today. What can't be added is named, once each. Null
 * when the Order is not this Member's.
 */
export async function orderAgain(
  orderId: string,
  memberId: string
): Promise<{ added: number; skipped: string[] } | null> {
  const order = await db.order.findFirst({
    where: { id: orderId, memberId },
    include: { lines: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return null;
  let added = 0;
  const skipped = new Set<string>();
  for (const line of order.lines) {
    const result = line.menuItemId
      ? await addLine(
          { memberId },
          {
            menuItemId: line.menuItemId,
            optionIds: line.optionIds,
            quantity: line.quantity,
            note: line.note ?? "",
          }
        )
      : { ok: false };
    if (result.ok) added++;
    else skipped.add(line.name);
  }
  return { added, skipped: [...skipped] };
}
