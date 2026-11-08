import { BagIcon, XIcon } from "@phosphor-icons/react/ssr";

import { OUTLINE_PILL, PRIMARY_PILL } from "@/components/panel";
import { formatPrice } from "@/lib/money";
import { currentCartOwner, getCart } from "@/modules/cart";

import { CartCount } from "./cart-count";
import { HiddenOn } from "./hidden-on";
import { PopoverLink } from "./popover-link";

/**
 * The Cart within thumb's reach once it holds something (docs/05, UI1-04):
 * a floating pill with the count and total that opens a drawer, a native
 * popover like the phone menu. Not on the Cart or checkout themselves.
 */
export async function CartFloat() {
  const owner = await currentCartOwner();
  const cart = owner ? await getCart(owner) : null;
  const count = cart?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
  if (!cart || count === 0) return null;
  const items = `${count} ${count === 1 ? "item" : "items"}`;
  return (
    <HiddenOn paths={["/cart", "/checkout"]}>
      {/* Room at the end of the page, so the pill never covers the footer. */}
      <div aria-hidden className="h-20 print:hidden" />
      <button
        type="button"
        popoverTarget="cart-drawer"
        className="cart-pill bg-primary text-primary-foreground fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-semibold shadow-lg print:hidden"
      >
        <BagIcon aria-hidden size={20} />
        <span>Your Cart</span>
        <CartCount count={count}>
          <span className="font-mono text-sm font-normal whitespace-nowrap">
            {count}
            <span className="sr-only"> {count === 1 ? "item" : "items"},</span>
            <span aria-hidden> · </span>
            {formatPrice(cart.totalCents)}
          </span>
        </CartCount>
      </button>
      <div
        id="cart-drawer"
        popover="auto"
        role="dialog"
        aria-labelledby="cart-drawer-title"
        // open:flex, never plain flex: it would override the closed
        // popover's display: none.
        className="drawer bg-background text-foreground m-0 ml-auto h-dvh w-[min(24rem,100vw)] flex-col p-6 shadow-xl backdrop:bg-black/40 open:flex"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="cart-drawer-title" className="font-display text-3xl italic">
            Your Cart
          </h2>
          <button
            type="button"
            popoverTarget="cart-drawer"
            popoverTargetAction="hide"
            aria-label="Close your Cart"
            className="border-input grid size-11 place-items-center rounded-full border"
          >
            <XIcon aria-hidden size={20} />
          </button>
        </div>
        <ul className="divide-border mt-6 grid divide-y overflow-y-auto">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-4 py-3">
              <span className="min-w-0">
                {line.quantity} x {line.name}
                {line.options.length > 0 && (
                  <span className="text-muted-foreground block text-sm">
                    {line.options.map((o) => o.name).join(", ")}
                  </span>
                )}
                {line.problem && (
                  <span className="text-destructive block text-sm font-semibold">
                    Can&apos;t be ordered now. Fix it in your Cart.
                  </span>
                )}
              </span>
              {line.lineCents !== null && (
                <span className="font-mono whitespace-nowrap">
                  {formatPrice(line.lineCents)}
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="border-border mt-auto grid gap-3 border-t pt-4">
          <p className="flex justify-between text-lg font-semibold">
            <span>
              Total <span className="sr-only">for {items}</span>
            </span>
            <span className="font-mono">{formatPrice(cart.totalCents)}</span>
          </p>
          {cart.blocked ? (
            <PopoverLink
              href="/cart"
              className={`${PRIMARY_PILL} justify-center`}
            >
              Fix your Cart to check out
            </PopoverLink>
          ) : (
            <>
              <PopoverLink
                href="/checkout"
                className={`${PRIMARY_PILL} justify-center`}
              >
                Check out
              </PopoverLink>
              <PopoverLink
                href="/cart"
                className={`${OUTLINE_PILL} justify-center`}
              >
                See your Cart
              </PopoverLink>
            </>
          )}
        </div>
      </div>
    </HiddenOn>
  );
}
