import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import {
  ArrowsClockwiseIcon,
  CakeIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CoffeeIcon,
  MonitorIcon,
  DownloadSimpleIcon,
  HeartIcon,
  IdentificationCardIcon,
  PlusIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SignOutIcon,
  StarIcon,
  StorefrontIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react/ssr";

import {
  ORDER_STATUS_LABEL,
  OrderStatusPill,
} from "@/components/order-status-pill";
import {
  Empty,
  IconCircle,
  OUTLINE_PILL,
  Panel,
  PRIMARY_PILL,
} from "@/components/panel";
import { StarCard } from "@/components/star-card";
import {
  formatDate,
  formatMonthYear,
  formatTime,
  greetingFor,
  now,
} from "@/lib/clock";
import { formatPrice } from "@/lib/money";
import { favouritesFor, type FavouriteView } from "@/modules/cart";
import { currentStaff, memberProfile, requireMember } from "@/modules/identity";
import { balance, birthdayTreat } from "@/modules/loyalty";
import { ordersForMember } from "@/modules/ordering";

import {
  addFavouriteAction,
  deleteAccountAction,
  orderAgainAction,
  removeFavouriteAction,
  signOutAction,
  updateProfileAction,
} from "./actions";
import { SaveDetailsButton } from "./save-details-button";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

const CANT_ADD: Record<NonNullable<FavouriteView["problem"]>, string> = {
  unavailable: "Off the menu now",
  sold_out: "Sold out today",
  option_sold_out: "A choice is sold out today",
  invalid_options: "Its options changed; save it again",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const FIELD =
  "rounded-card border-input bg-background min-h-11 w-full border px-3";
// Orders still on their way to the counter, or waiting at it.
const OPEN = ["placed", "paid", "accepted", "preparing", "ready"];
// The rest of the latest 20 fold away under "Earlier orders".
const SHOWN = 5;

type OrderSummary = Awaited<ReturnType<typeof ordersForMember>>[number];

export default function AccountPage() {
  return (
    <main id="main" className="page-width flex-1 pt-8">
      <Suspense fallback={<p>Opening your account...</p>}>
        <Account />
      </Suspense>
    </main>
  );
}

async function Account() {
  const member = await requireMember("/account");
  const profile = await memberProfile(member.id);
  // Lands before the balance is read, so the Star Card shows it (LOY-04).
  const treat = await birthdayTreat(member.id, profile?.birthMonth ?? null);
  const [orders, stars, favourites, staff] = await Promise.all([
    ordersForMember(member.id),
    balance(member.id),
    favouritesFor(member.id),
    currentStaff("barista"),
  ]);
  const live = orders.find((order) => OPEN.includes(order.status));
  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground font-mono text-sm">
            {greetingFor(now())}
          </p>
          <h1 className="font-display pb-1 text-5xl leading-[1.1] italic md:text-6xl">
            Hi{member.name ? `, ${member.name}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Signed in as {member.email}.
          </p>
          {profile?.createdAt && (
            <p className="border-border mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
              <StarIcon
                aria-hidden
                size={14}
                weight="fill"
                className="text-star"
              />
              Member since {formatMonthYear(profile.createdAt)}
            </p>
          )}
        </div>
        <form action={signOutAction}>
          <button type="submit" className={OUTLINE_PILL}>
            <SignOutIcon aria-hidden size={18} />
            Sign out
          </button>
        </form>
      </header>

      {/* Phones get a shortcut past the Star Card; the footer's Back to top
          brings them up again. */}
      <nav
        aria-label="On this page"
        className="-mt-4 flex flex-wrap gap-2 lg:hidden"
      >
        <a href="#orders" className={`${OUTLINE_PILL} text-sm`}>
          Orders
        </a>
        <a href="#favourites" className={`${OUTLINE_PILL} text-sm`}>
          Favourites
        </a>
        <a href="#details" className={`${OUTLINE_PILL} text-sm`}>
          Your details
        </a>
      </nav>

      {treat && (
        <p
          role="status"
          className="bg-muted rounded-card flex items-center gap-3 p-4 text-lg"
        >
          <CakeIcon aria-hidden size={28} className="shrink-0" />
          Happy birthday month! We added 9 Stars to your card, so a drink is on
          us.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start 2xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="grid gap-4 lg:sticky lg:top-6">
          {staff && (
            // The staff screens are not in the public header; Staff find
            // them here (members never see this box).
            <nav
              aria-label="For Staff"
              className="rounded-card border-primary divide-border divide-y border-2"
            >
              <p className="text-muted-foreground px-4 pt-3 pb-2 text-sm font-semibold">
                For Staff ({staff.role === "manager" ? "Manager" : "Barista"})
              </p>
              <RowLink href="/manage" icon={<StorefrontIcon size={20} />}>
                Manage the cafe
              </RowLink>
              <RowLink href="/bar" icon={<MonitorIcon size={20} />}>
                Bar Screen
              </RowLink>
            </nav>
          )}
          <section aria-labelledby="star-card">
            <h2 id="star-card" className="sr-only">
              Star Card
            </h2>
            <StarCard balance={stars} />
          </section>
          <nav
            aria-label="More for your account"
            className="rounded-card border-border divide-border divide-y border"
          >
            <RowLink href="/account/stars" icon={<StarIcon size={20} />}>
              Your Star history
            </RowLink>
            <RowLink
              href="/api/account/export"
              download
              icon={<DownloadSimpleIcon size={20} />}
              note="A JSON file of your details, orders and Stars."
            >
              Download my data
            </RowLink>
            <RowLink href="/privacy" icon={<ShieldCheckIcon size={20} />}>
              Privacy
            </RowLink>
          </nav>
        </aside>

        <div className="grid gap-8 2xl:grid-cols-2 2xl:items-start">
          {live && <LiveOrder order={live} />}

          <div className="grid gap-8">
            <Panel
              id="orders"
              title="Your orders"
              icon={<ReceiptIcon size={20} />}
            >
              {orders.length === 0 ? (
                <Empty icon={<CoffeeIcon size={24} />}>
                  <p>No orders yet. Your first kopi is a few taps away.</p>
                  <Link href="/menu" className={PRIMARY_PILL}>
                    See the menu
                  </Link>
                </Empty>
              ) : (
                <>
                  <ul className="divide-border -my-3 divide-y">
                    {orders.slice(0, SHOWN).map((order) => (
                      <OrderRow key={order.id} order={order} />
                    ))}
                  </ul>
                  {orders.length > SHOWN && (
                    <details className="border-border mt-3 border-t pt-1">
                      <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold">
                        Earlier orders ({orders.length - SHOWN})
                      </summary>
                      <ul className="divide-border divide-y">
                        {orders.slice(SHOWN).map((order) => (
                          <OrderRow key={order.id} order={order} />
                        ))}
                      </ul>
                    </details>
                  )}
                  {orders.length === 20 && (
                    <p className="text-muted-foreground mt-4 text-sm">
                      Your latest 20 orders. Download my data has every one.
                    </p>
                  )}
                </>
              )}
            </Panel>
          </div>

          <div className="grid gap-8">
            <Panel
              id="favourites"
              title="Your Favourites"
              icon={<HeartIcon size={20} />}
            >
              {favourites.length === 0 ? (
                <Empty icon={<HeartIcon size={24} />}>
                  <p>
                    Nothing saved yet. On a drink&apos;s page, choose it the way
                    you like it and tap Save as Favourite.
                  </p>
                  <Link href="/menu" className={OUTLINE_PILL}>
                    Find a drink
                  </Link>
                </Empty>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {favourites.map((favourite) => (
                    <li
                      key={favourite.id}
                      className="bg-muted rounded-card flex flex-col justify-between gap-4 p-4"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/menu/item/${favourite.slug}`}
                            className="font-semibold"
                          >
                            {favourite.name}
                          </Link>
                          {favourite.options.length > 0 && (
                            <p className="text-muted-foreground mt-1 text-sm">
                              {favourite.options.join(", ")}
                            </p>
                          )}
                        </div>
                        <form action={removeFavouriteAction}>
                          <input type="hidden" name="id" value={favourite.id} />
                          <button
                            type="submit"
                            title="Remove"
                            className="text-muted-foreground hover:bg-background hover:text-foreground -mt-2 -mr-2 grid size-11 place-items-center rounded-full"
                          >
                            <XIcon aria-hidden size={18} />
                            <span className="sr-only">
                              Remove {favourite.name}
                            </span>
                          </button>
                        </form>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {favourite.problem ? (
                          <span className="text-muted-foreground mr-auto text-sm">
                            {CANT_ADD[favourite.problem]}
                          </span>
                        ) : (
                          <>
                            <span className="mr-auto font-mono">
                              {formatPrice(favourite.unitCents!)}
                            </span>
                            <form action={addFavouriteAction}>
                              <input
                                type="hidden"
                                name="id"
                                value={favourite.id}
                              />
                              <button type="submit" className={PRIMARY_PILL}>
                                <PlusIcon aria-hidden size={16} />
                                Add
                                <span className="sr-only">
                                  {" "}
                                  {favourite.name}
                                </span>
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              id="details"
              title="Your details"
              icon={<IdentificationCardIcon size={20} />}
            >
              <form action={updateProfileAction} className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid content-start gap-1.5">
                    <label htmlFor="name" className="font-semibold">
                      Name for your orders
                    </label>
                    <input
                      id="name"
                      name="name"
                      defaultValue={profile?.name ?? ""}
                      maxLength={60}
                      className={FIELD}
                    />
                  </div>
                  <div className="grid content-start gap-1.5">
                    <label htmlFor="birthMonth" className="font-semibold">
                      Birthday month
                    </label>
                    <select
                      id="birthMonth"
                      name="birthMonth"
                      defaultValue={profile?.birthMonth ?? ""}
                      aria-describedby="birthMonth-hint"
                      className={FIELD}
                    >
                      <option value="">Not set</option>
                      {MONTHS.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <p
                      id="birthMonth-hint"
                      className="text-muted-foreground text-sm"
                    >
                      For a free drink once a year, in your birthday month.
                    </p>
                  </div>
                </div>
                <label className="flex min-h-11 items-start gap-3">
                  <input
                    type="checkbox"
                    name="marketingOptIn"
                    defaultChecked={profile?.marketingOptIn}
                    className="mt-1 size-5"
                  />
                  <span>
                    Email me about new drinks and Events. Separate from order
                    emails; untick any time.
                  </span>
                </label>
                <SaveDetailsButton />
              </form>

              <details className="border-border mt-6 border-t pt-4">
                <summary className="text-destructive inline-flex min-h-11 cursor-pointer items-center gap-2 font-semibold">
                  <TrashIcon aria-hidden size={18} />
                  Delete my account
                </summary>
                <form action={deleteAccountAction} className="grid gap-3 py-2">
                  <p className="max-w-measure">
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
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The newest Order still in play, with the way to follow it. No
 * role=status: the Birthday Treat is this page's only status line. */
function LiveOrder({ order }: { order: OrderSummary }) {
  const ready = order.status === "ready";
  return (
    <div
      className={`rounded-card flex flex-wrap items-center gap-4 border p-4 2xl:col-span-2 ${ready ? "border-success" : "border-border"}`}
    >
      <IconCircle>
        {ready ? (
          <CheckCircleIcon size={20} weight="fill" className="text-success" />
        ) : (
          <CoffeeIcon size={20} />
        )}
      </IconCircle>
      {/* basis-48: on a phone the button drops below instead of squeezing the text. */}
      <div className="min-w-0 flex-1 basis-48">
        <p className="font-semibold">
          {ready
            ? "Your order is ready at the counter. See you!"
            : `Your order is ${ORDER_STATUS_LABEL[order.status]}.`}
        </p>
        {/* Not the summary: the list below shows it, and tests read it once. */}
        <p className="text-muted-foreground text-sm">
          <span className="font-mono">{order.code}</span>, placed at{" "}
          {formatTime(order.placedAt)}
        </p>
      </div>
      <Link href={order.link} className={PRIMARY_PILL}>
        Follow your order
      </Link>
    </div>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  return (
    <li className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={order.link} className="font-mono font-semibold">
            {order.code}
          </Link>
          <OrderStatusPill status={order.status} />
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {formatDate(order.placedAt)}, {formatTime(order.placedAt)}
        </p>
        <p className="mt-1">{order.summary}</p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <span className="font-mono whitespace-nowrap">
          {formatPrice(order.totalCents)}
        </span>
        <form action={orderAgainAction}>
          <input type="hidden" name="orderId" value={order.id} />
          <button type="submit" className={`${OUTLINE_PILL} text-sm`}>
            <ArrowsClockwiseIcon aria-hidden size={16} />
            Order again
            <span className="sr-only"> ({order.code})</span>
          </button>
        </form>
      </div>
    </li>
  );
}

function RowLink({
  href,
  icon,
  download,
  note,
  children,
}: {
  href: string;
  icon: ReactNode;
  download?: boolean;
  note?: string;
  children: ReactNode;
}) {
  const className =
    "hover:bg-muted first:rounded-t-card last:rounded-b-card flex min-h-12 items-center gap-3 px-4 py-2 no-underline";
  const inner = (
    <>
      <span aria-hidden className="text-muted-foreground shrink-0">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-medium">{children}</span>
        {note && (
          <span className="text-muted-foreground block text-sm">{note}</span>
        )}
      </span>
      {/* A download keeps you on this page, so it gets no caret. */}
      {!download && (
        <CaretRightIcon
          aria-hidden
          size={16}
          className="text-muted-foreground"
        />
      )}
    </>
  );
  // A file download is a plain link, not a client-side navigation.
  return download ? (
    <a href={href} download className={className}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
