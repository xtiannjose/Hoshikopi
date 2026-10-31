import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { StarCard } from "@/components/star-card";
import { formatDate, formatTime } from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { favouritesFor, type FavouriteView } from "@/modules/cart";
import { memberProfile, requireMember } from "@/modules/identity";
import { balance } from "@/modules/loyalty";
import { ordersForMember } from "@/modules/ordering";

import {
  addFavouriteAction,
  deleteAccountAction,
  orderAgainAction,
  removeFavouriteAction,
  signOutAction,
  updateProfileAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

const STATUS: Record<string, string> = {
  placed: "Placed",
  paid: "Paid",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked Up",
  cancelled: "Cancelled",
  expired: "Expired",
  refunded: "Refunded",
};

const CANT_ADD: Record<NonNullable<FavouriteView["problem"]>, string> = {
  unavailable: "Off the menu now",
  sold_out: "Sold out today",
  option_sold_out: "A choice is sold out today",
  invalid_options: "Its options changed; save it again",
};

export default function AccountPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 md:px-8">
      <Suspense fallback={<p className="pt-8">Opening your account...</p>}>
        <Account />
      </Suspense>
    </main>
  );
}

async function Account() {
  const member = await requireMember("/account");
  const [orders, stars, profile, favourites] = await Promise.all([
    ordersForMember(member.id),
    balance(member.id),
    memberProfile(member.id),
    favouritesFor(member.id),
  ]);
  return (
    <div className="grid gap-10 pt-8">
      <div>
        <h1 className="font-display pb-1 text-5xl italic">
          Hi{member.name ? `, ${member.name}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Signed in as {member.email}.
        </p>
      </div>

      <section aria-labelledby="star-card" className="grid gap-3">
        <h2 id="star-card" className="sr-only">
          Star Card
        </h2>
        <StarCard balance={stars} />
        <Link href="/account/stars">Your Star history</Link>
      </section>

      <section aria-labelledby="orders">
        <h2 id="orders" className="font-display text-3xl italic">
          Your orders
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3">
            No orders yet. <Link href="/menu">See the menu</Link>
          </p>
        ) : (
          <ul className="border-border mt-4 border-t">
            {orders.map((order) => (
              <li
                key={order.id}
                className="border-border flex flex-wrap items-baseline justify-between gap-3 border-b py-3"
              >
                <span>
                  <Link href={order.link} className="font-mono font-semibold">
                    {order.code}
                  </Link>{" "}
                  <span className="text-muted-foreground text-sm">
                    {formatDate(order.placedAt)}, {formatTime(order.placedAt)}
                  </span>
                  <span className="block">{order.summary}</span>
                </span>
                <span className="text-right">
                  <span className="block font-mono whitespace-nowrap">
                    {formatPrice(order.totalCents)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {STATUS[order.status]}
                  </span>
                  <form action={orderAgainAction} className="mt-1">
                    <input type="hidden" name="orderId" value={order.id} />
                    <button
                      type="submit"
                      className="border-input min-h-11 rounded-full border px-4 text-sm font-semibold"
                    >
                      Order again
                      <span className="sr-only"> ({order.code})</span>
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="favourites">
        <h2 id="favourites" className="font-display text-3xl italic">
          Your Favourites
        </h2>
        {favourites.length === 0 ? (
          <p className="mt-3">
            Nothing saved yet. On a drink&apos;s page, choose it the way you
            like it and tap Save as Favourite.
          </p>
        ) : (
          <ul className="border-border mt-4 border-t">
            {favourites.map((favourite) => (
              <li
                key={favourite.id}
                className="border-border flex flex-wrap items-center justify-between gap-3 border-b py-3"
              >
                <span>
                  <Link
                    href={`/menu/item/${favourite.slug}`}
                    className="font-semibold"
                  >
                    {favourite.name}
                  </Link>
                  {favourite.options.length > 0 && (
                    <span className="text-muted-foreground block text-sm">
                      {favourite.options.join(", ")}
                    </span>
                  )}
                </span>
                <span className="flex flex-wrap items-center gap-3">
                  {favourite.problem ? (
                    <span className="text-muted-foreground text-sm">
                      {CANT_ADD[favourite.problem]}
                    </span>
                  ) : (
                    <>
                      <span className="font-mono">
                        {formatPrice(favourite.unitCents!)}
                      </span>
                      <form action={addFavouriteAction}>
                        <input type="hidden" name="id" value={favourite.id} />
                        <button
                          type="submit"
                          className="bg-primary text-primary-foreground min-h-11 rounded-full px-4 font-semibold"
                        >
                          Add
                          <span className="sr-only"> {favourite.name}</span>
                        </button>
                      </form>
                    </>
                  )}
                  <form action={removeFavouriteAction}>
                    <input type="hidden" name="id" value={favourite.id} />
                    <button
                      type="submit"
                      className="border-input min-h-11 rounded-full border px-4 font-semibold"
                    >
                      Remove
                      <span className="sr-only"> {favourite.name}</span>
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="details" className="grid gap-4">
        <h2 id="details" className="font-display text-3xl italic">
          Your details
        </h2>
        <form action={updateProfileAction} className="grid max-w-md gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="name" className="font-semibold">
              Name for your orders
            </label>
            <input
              id="name"
              name="name"
              defaultValue={profile?.name ?? ""}
              maxLength={60}
              className="rounded-card border-input bg-background min-h-11 border px-3"
            />
          </div>
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              name="marketingOptIn"
              defaultChecked={profile?.marketingOptIn}
              className="mt-1 size-5"
            />
            <span>
              Email me about new drinks and Events. Separate from order emails;
              untick any time.
            </span>
          </label>
          <button
            type="submit"
            className="border-input min-h-11 justify-self-start rounded-full border px-5 font-semibold"
          >
            Save my details
          </button>
        </form>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="/api/account/export" download>
            Download my data
          </a>
          <Link href="/privacy">Privacy</Link>
        </p>
        <details className="max-w-md">
          <summary className="text-destructive min-h-11 cursor-pointer py-2 font-semibold">
            Delete my account
          </summary>
          <form action={deleteAccountAction} className="grid gap-3 py-2">
            <p>
              Your Stars and sign-in go for good. Your orders stay as the
              cafe&apos;s records, without your name, email or phone.
            </p>
            <button
              type="submit"
              className="border-destructive text-destructive min-h-11 justify-self-start rounded-full border px-5 font-semibold"
            >
              Yes, delete my account
            </button>
          </form>
        </details>
      </section>

      <form action={signOutAction}>
        <button
          type="submit"
          className="border-input min-h-11 rounded-full border px-5"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
