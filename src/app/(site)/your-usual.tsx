import { ArrowsClockwiseIcon, PlusIcon } from "@phosphor-icons/react/ssr";

import { OUTLINE_PILL, PRIMARY_PILL } from "@/components/panel";
import { formatPrice } from "@/lib/money";
import { favouritesFor } from "@/modules/cart";
import { currentMember } from "@/modules/identity";
import { ordersForMember } from "@/modules/ordering";

import { addFavouriteAction, orderAgainAction } from "./account/actions";

/**
 * "Your usual" under Home's hero (audit FEAT-09): a signed-in Member's
 * newest Favourite they can still order, or else their last Order, one tap
 * from the Cart. Nothing for a Guest; in Suspense, so Home stays
 * prerendered.
 */
export async function YourUsual() {
  const member = await currentMember();
  if (!member) return null;
  const [favourites, [last]] = await Promise.all([
    favouritesFor(member.id),
    ordersForMember(member.id, 1),
  ]);
  const favourite = favourites.filter((f) => f.unitCents !== null).at(-1);
  if (!favourite && !last) return null;
  return (
    <section
      aria-labelledby="your-usual"
      className="rounded-card border-border mt-10 flex flex-wrap items-center justify-between gap-4 border p-5"
    >
      <div className="min-w-0">
        <h2 id="your-usual" className="font-display text-2xl italic">
          Your usual
        </h2>
        <p className="mt-1">
          {favourite
            ? [favourite.name, ...favourite.options].join(", ")
            : last.summary}
        </p>
      </div>
      {favourite ? (
        <form action={addFavouriteAction}>
          <input type="hidden" name="id" value={favourite.id} />
          <button type="submit" className={PRIMARY_PILL}>
            <PlusIcon aria-hidden size={18} />
            Add for {formatPrice(favourite.unitCents ?? 0)}
            <span className="sr-only"> ({favourite.name})</span>
          </button>
        </form>
      ) : (
        <form action={orderAgainAction}>
          <input type="hidden" name="orderId" value={last.id} />
          <button type="submit" className={OUTLINE_PILL}>
            <ArrowsClockwiseIcon aria-hidden size={18} />
            Order again
            <span className="sr-only"> ({last.code})</span>
          </button>
        </form>
      )}
    </section>
  );
}
