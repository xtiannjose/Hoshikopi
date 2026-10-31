import Link from "next/link";
import { BagIcon } from "@phosphor-icons/react/ssr";

import { formatPrice } from "@/lib/money";
import { currentCartOwner, getCart } from "@/modules/cart";

const linkClass =
  "bg-primary text-primary-foreground inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold no-underline shadow-sm transition-transform active:scale-[0.98]";

/** The Cart button before the count arrives (and on prerendered pages). */
export function CartLink() {
  return (
    <Link href="/cart" className={linkClass}>
      <BagIcon aria-hidden size={20} />
      Cart
    </Link>
  );
}

/** Cart with its count and total, read per browser (inside Suspense). */
export async function CartButton() {
  const owner = await currentCartOwner();
  const cart = owner ? await getCart(owner) : null;
  const count = cart?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
  if (!cart || count === 0) return <CartLink />;
  return (
    <Link href="/cart" className={linkClass}>
      <BagIcon aria-hidden size={20} />
      Cart
      <span className="font-mono text-sm font-normal whitespace-nowrap">
        {count}
        <span className="sr-only"> {count === 1 ? "item" : "items"},</span>
        {/* The total shows from 640 px; phones keep the pill on one line. */}
        <span className="sr-only sm:not-sr-only">
          <span aria-hidden> · </span>
          {formatPrice(cart.totalCents)}
        </span>
      </span>
    </Link>
  );
}
