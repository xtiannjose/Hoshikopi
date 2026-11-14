import Link from "next/link";

/**
 * Why a Cart can't be one Order: it is made in one Pickup Window, so it
 * holds no more than that window's Capacity (audit journeys:3).
 */
export function OrderLimitNote({
  limit,
}: {
  limit: { drinks: number; food: number };
}) {
  return (
    <p className="bg-muted rounded-card p-4">
      One order fits one Pickup Window: up to {limit.drinks} drinks and{" "}
      {limit.food} food items. For a bigger order,{" "}
      <Link href="/cafe/inquire?kind=large_order">send us an inquiry</Link> a
      day ahead and we&apos;ll get it ready.
    </p>
  );
}
