import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  CoffeeIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/page-header";
import { Empty, PRIMARY_PILL } from "@/components/panel";
import { PickupLine } from "@/components/pickup-line";
import { formatTime, now } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { getOrderingDay, orderingState } from "@/modules/cafe";
import {
  currentCartOwner,
  getCart,
  MAX_LINE_QUANTITY,
  type CartLineView,
} from "@/modules/cart";
import { MAX_DRINKS_PER_ORDER } from "@/modules/ordering";

import { removeLineAction, setQuantityAction } from "./actions";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false },
};

export default function CartPage({ searchParams }: PageProps<"/cart">) {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <div className="w-full max-w-6xl">
        <PageHeader
          back={<BackLink href="/menu">Keep browsing</BackLink>}
          title="Your Cart"
        />
        <Suspense fallback={<p className="mt-6">Getting your Cart...</p>}>
          <LeftOut searchParams={searchParams} />
          <Cart />
        </Suspense>
      </div>
    </main>
  );
}

const PROBLEMS: Record<NonNullable<CartLineView["problem"]>, string> = {
  unavailable: "This is off the menu now.",
  sold_out: "Sold out today.",
  option_sold_out: "One of its options is sold out today.",
  invalid_options: "Its options changed on the menu.",
};

/** After Order again: how many Lines could not be added today (ORD-11). */
async function LeftOut({
  searchParams,
}: Pick<PageProps<"/cart">, "searchParams">) {
  const { left } = await searchParams;
  // A count, never text from the address, capped at an Order's size.
  const count = Math.min(Math.floor(Number(left)) || 0, 20);
  if (count < 1) return null;
  return (
    <p role="status" className="bg-muted rounded-card mt-6 p-4">
      {count === 1
        ? "1 item from that order is sold out or off the menu today, so we left it out."
        : `${count} items from that order are sold out or off the menu today, so we left them out.`}
    </p>
  );
}

async function Cart() {
  const owner = await currentCartOwner();
  const cart = owner ? await getCart(owner) : null;
  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mt-8">
        <Empty icon={<CoffeeIcon size={24} />}>
          <div>
            <p className="text-lg font-semibold">Your Cart is empty.</p>
            <p className="text-muted-foreground">
              Nothing brewing yet. Pick a drink and we&apos;ll have it ready at
              the counter.
            </p>
          </div>
          <Link href="/menu" className={PRIMARY_PILL}>
            See the menu
          </Link>
        </Empty>
      </div>
    );
  }
  const tooManyDrinks = cart.drinks > MAX_DRINKS_PER_ORDER;
  // The same ordering state checkout reads, so the Cart warns first (ORD-07).
  const at = now();
  const state = orderingState(at, await getOrderingDay(at));
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <ul className="border-border border-t">
        {cart.lines.map((line) => (
          <li key={line.id} className="border-border grid gap-3 border-b py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">
                <Link href={`/menu/item/${line.slug}`}>{line.name}</Link>
              </h2>
              <p className="font-mono whitespace-nowrap">
                {line.lineCents === null ? "" : formatPrice(line.lineCents)}
              </p>
            </div>
            {line.options.length > 0 && (
              <p className="text-muted-foreground text-sm">
                {line.options.map((option) => option.name).join(", ")}
              </p>
            )}
            {line.note && (
              <p className="text-sm">
                <span className="font-semibold">Note:</span> {line.note}
              </p>
            )}
            {line.problem && (
              <p className="text-destructive font-semibold">
                {PROBLEMS[line.problem]} Remove it to check out.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-label={`Quantity of ${line.name}`}
                className="flex items-center gap-1"
              >
                <form action={setQuantityAction}>
                  <input type="hidden" name="lineId" value={line.id} />
                  <input
                    type="hidden"
                    name="quantity"
                    value={line.quantity - 1}
                  />
                  <button
                    type="submit"
                    aria-label={
                      line.quantity === 1 ? `Remove ${line.name}` : "One less"
                    }
                    className="border-input grid size-11 place-items-center rounded-full border"
                  >
                    <MinusIcon aria-hidden size={18} />
                  </button>
                </form>
                <span className="w-8 text-center font-mono text-lg">
                  {line.quantity}
                </span>
                <form action={setQuantityAction}>
                  <input type="hidden" name="lineId" value={line.id} />
                  <input
                    type="hidden"
                    name="quantity"
                    value={line.quantity + 1}
                  />
                  <button
                    type="submit"
                    aria-label="One more"
                    disabled={line.quantity >= MAX_LINE_QUANTITY}
                    className="border-input grid size-11 place-items-center rounded-full border disabled:opacity-40"
                  >
                    <PlusIcon aria-hidden size={18} />
                  </button>
                </form>
              </div>
              <form action={removeLineAction}>
                <input type="hidden" name="lineId" value={line.id} />
                <button
                  type="submit"
                  className="min-h-11 px-2 underline underline-offset-4"
                >
                  Remove<span className="sr-only"> {line.name}</span>
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <aside className="rounded-card border-border grid gap-5 border p-5 lg:sticky lg:top-6">
        <div>
          <div
            aria-live="polite"
            className="flex items-baseline justify-between gap-4 text-xl"
          >
            <p className="font-semibold">Total</p>
            <p className="font-mono font-semibold">
              {formatPrice(cart.totalCents)}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            Prices include VAT. No fees on top.
          </p>
        </div>

        {tooManyDrinks && (
          <p className="bg-muted rounded-card p-4">
            Orders hold up to {MAX_DRINKS_PER_ORDER} drinks. For a bigger order,{" "}
            <Link href="/cafe/inquire?kind=large_order">
              send us an inquiry
            </Link>{" "}
            a day ahead and we&apos;ll get it ready.
          </p>
        )}
        {!state.canOrder &&
          (state.reason === "paused" ? (
            <div className="bg-muted rounded-card grid gap-1 p-4">
              <p className="text-warning font-semibold">
                Ordering is paused until {formatTime(state.until)}.
              </p>
              {state.message && <p>{state.message}</p>}
            </div>
          ) : (
            <p className="bg-muted rounded-card p-4">
              We&apos;re closed right now. Your Cart is saved for later.{" "}
              <Link href="/cafe">See our hours</Link>
            </p>
          ))}
        <StarsLine
          drinks={cart.drinks}
          member={owner !== null && "memberId" in owner}
        />
        {cart.blocked || tooManyDrinks ? (
          <p className="font-semibold">Fix the notes above to check out.</p>
        ) : (
          <Link
            href="/checkout"
            className="bg-primary text-primary-foreground inline-flex min-h-14 w-full items-center justify-center rounded-full px-8 text-lg font-semibold no-underline"
          >
            Check out
          </Link>
        )}
        <PickupLine />
      </aside>
    </div>
  );
}

/** What this Cart lights on the Star Card, or how a Guest can collect. */
function StarsLine({ drinks, member }: { drinks: number; member: boolean }) {
  if (drinks === 0) return null;
  const stars = drinks === 1 ? "1 Star" : `${drinks} Stars`;
  return (
    <p className="text-muted-foreground flex gap-2 text-sm">
      <StarIcon aria-hidden size={20} className="shrink-0" />
      <span>
        {member ? (
          `This order lights ${stars} when you pick it up.`
        ) : (
          <>
            <Link href="/sign-in?next=/checkout">Sign in first</Link> and this
            order lights {stars}. Your Cart comes with you.
          </>
        )}
      </span>
    </p>
  );
}
