import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import {
  CalendarStarIcon,
  CaretRightIcon,
  ChartBarIcon,
  ChatCircleTextIcon,
  ClockIcon,
  ForkKnifeIcon,
  MonitorIcon,
  NewspaperIcon,
  ReceiptIcon,
  SignOutIcon,
  StarIcon,
  StorefrontIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";

import { formatTime, now } from "@/lib/clock";
import { getOrderingDay, orderingState } from "@/modules/cafe";
import { inquiriesForStaff } from "@/modules/content";
import { requireStaff, type Staff } from "@/modules/identity";
import { barBoard } from "@/modules/ordering";

import { signOutAction } from "./actions";

export const metadata: Metadata = { title: "Manage", robots: { index: false } };

const ROLE = { barista: "Barista", manager: "Manager", customer: "Customer" };

type Area = {
  href: string;
  label: string;
  note: string;
  icon: ReactNode;
  roles: Staff["role"][];
};

// What each role may open, grouped by job; pages also check for themselves.
const GROUPS: { title: string; areas: Area[] }[] = [
  {
    title: "Run the day",
    areas: [
      {
        href: "/bar",
        label: "Bar Screen",
        note: "Live orders, one tap to move each along",
        icon: <MonitorIcon size={22} />,
        roles: ["barista", "manager"],
      },
      {
        href: "/manage/orders",
        label: "Orders and Refunds",
        note: "Today's orders, totals and refunds",
        icon: <ReceiptIcon size={22} />,
        roles: ["manager"],
      },
      {
        href: "/manage/hours",
        label: "Hours and Capacity",
        note: "Opening hours, capacity, pause ordering",
        icon: <ClockIcon size={22} />,
        roles: ["manager"],
      },
    ],
  },
  {
    title: "Menu and stories",
    areas: [
      {
        href: "/manage/menu",
        label: "Menu",
        note: "Drinks, prices, photos, sold out",
        icon: <ForkKnifeIcon size={22} />,
        roles: ["barista", "manager"],
      },
      {
        href: "/manage/events",
        label: "Events",
        note: "Events, sign-ups and the weekly ones",
        icon: <CalendarStarIcon size={22} />,
        roles: ["manager"],
      },
      {
        href: "/manage/posts",
        label: "Posts",
        note: "News from the cafe",
        icon: <NewspaperIcon size={22} />,
        roles: ["manager"],
      },
      {
        href: "/manage/inquiries",
        label: "Inquiries",
        note: "Messages from the Visit page",
        icon: <ChatCircleTextIcon size={22} />,
        roles: ["manager"],
      },
    ],
  },
  {
    title: "People and numbers",
    areas: [
      {
        href: "/manage/reports",
        label: "Reports",
        note: "Sales, top drinks and Stars",
        icon: <ChartBarIcon size={22} />,
        roles: ["manager"],
      },
      {
        href: "/manage/stars",
        label: "Adjust Stars",
        note: "Add or take Stars, with a reason",
        icon: <StarIcon size={22} />,
        roles: ["manager"],
      },
      {
        href: "/manage/staff",
        label: "Staff",
        note: "Roles and signing people out",
        icon: <UsersThreeIcon size={22} />,
        roles: ["manager"],
      },
      {
        href: "/manage/cafe",
        label: "Cafe details",
        note: "Address, amenities and the story",
        icon: <StorefrontIcon size={22} />,
        roles: ["manager"],
      },
    ],
  },
];

export default function ManagePage() {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Suspense
        fallback={
          <>
            <h1 className="font-display text-5xl italic">Manage</h1>
            <p className="mt-4">Checking who you are...</p>
          </>
        }
      >
        <Who />
      </Suspense>
    </main>
  );
}

async function Who() {
  const staff = await requireStaff("barista");
  const at = now();
  const manager = staff.role === "manager";
  const [day, board, inquiries] = await Promise.all([
    getOrderingDay(at),
    barBoard(at),
    manager ? inquiriesForStaff() : Promise.resolve([]),
  ]);
  const state = orderingState(at, day);
  const ordering = state.canOrder
    ? {
        value: "Taking orders",
        note: `Last order ${formatTime(state.lastOrderAt)}`,
      }
    : state.reason === "paused"
      ? { value: "Paused", note: `Until ${formatTime(state.until)}` }
      : state.reason === "closed_today"
        ? { value: "Closed today", note: "No hours set for today" }
        : {
            value: "Not taking orders",
            note:
              state.reason === "before_opening"
                ? "Before opening time"
                : "After last order",
          };
  const fresh = inquiries.filter((i) => i.status === "new").length;

  return (
    <div className="grid gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display pb-1 text-5xl italic">Manage</h1>
          <p className="text-muted-foreground mt-2">
            Signed in as {staff.name} ({ROLE[staff.role]}).
          </p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="border-input hover:bg-muted inline-flex min-h-11 items-center gap-2 rounded-full border px-5 font-semibold"
          >
            <SignOutIcon aria-hidden size={18} />
            Sign out
          </button>
        </form>
      </header>

      <section aria-labelledby="today">
        <h2 id="today" className="sr-only">
          Today
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Ordering"
            value={ordering.value}
            note={ordering.note}
            href={manager ? "/manage/hours" : undefined}
            tone={state.canOrder ? "good" : "plain"}
          />
          <Stat
            label="Live orders"
            value={String(board.orders.length)}
            note={
              board.orders.length === 1
                ? "order on the bar"
                : "orders on the bar"
            }
            href="/bar"
          />
          {manager && (
            <Stat
              label="New inquiries"
              value={String(fresh)}
              note={fresh === 0 ? "All answered" : "Waiting for a reply"}
              href="/manage/inquiries"
              tone={fresh > 0 ? "attention" : "plain"}
            />
          )}
        </ul>
      </section>

      {GROUPS.map((group) => {
        const areas = group.areas.filter((a) => a.roles.includes(staff.role));
        if (areas.length === 0) return null;
        const id = `group-${group.title.toLowerCase().replace(/\W+/g, "-")}`;
        return (
          <section key={group.title} aria-labelledby={id}>
            <h2 id={id} className="font-display text-2xl italic">
              {group.title}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((area) => (
                <li key={area.href}>
                  <Link
                    href={area.href}
                    className="rounded-card border-border hover:bg-muted group flex h-full items-center gap-4 border p-4 no-underline transition-colors"
                  >
                    <span
                      aria-hidden
                      className="bg-muted group-hover:bg-background grid size-12 shrink-0 place-items-center rounded-full transition-colors"
                    >
                      {area.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold">
                        {area.label}
                      </span>
                      <span className="text-muted-foreground block text-sm">
                        {area.note}
                      </span>
                    </span>
                    <CaretRightIcon
                      aria-hidden
                      size={18}
                      className="text-muted-foreground shrink-0"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** One figure in the Today strip; links to where it can be acted on. */
function Stat({
  label,
  value,
  note,
  href,
  tone = "plain",
}: {
  label: string;
  value: string;
  note: string;
  href?: string;
  tone?: "plain" | "good" | "attention";
}) {
  const accent =
    tone === "good"
      ? "text-success"
      : tone === "attention"
        ? "text-warning"
        : "text-foreground";
  const body = (
    <>
      <span className="text-muted-foreground block text-sm font-semibold">
        {label}
      </span>
      <span className={`font-display mt-1 block text-3xl italic ${accent}`}>
        {value}
      </span>
      <span className="text-muted-foreground mt-1 block text-sm">{note}</span>
    </>
  );
  return (
    <li className="bg-muted rounded-card">
      {href ? (
        <Link
          href={href}
          className="hover:ring-input block h-full rounded-[inherit] p-5 no-underline hover:ring-1"
        >
          {body}
        </Link>
      ) : (
        <div className="p-5">{body}</div>
      )}
    </li>
  );
}
