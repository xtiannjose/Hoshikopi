import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  CalendarPlusIcon,
  CalendarStarIcon,
  ClockIcon,
  GaugeIcon,
  PauseCircleIcon,
} from "@phosphor-icons/react/ssr";

import { BackLink } from "@/components/back-link";
import { Field } from "@/components/fields";
import { PageHeader } from "@/components/page-header";
import { Empty, Panel, Pill } from "@/components/panel";
import { formatDate, formatTime, manila, now } from "@/lib/clock";
import { formatClock } from "@/lib/hours";
import {
  getHoursForStaff,
  getOrderingDay,
  orderingState,
  prepMinutes,
} from "@/modules/cafe";
import { requireStaff } from "@/modules/identity";

import { deleteSpecialHoursAction, pauseAction, resumeAction } from "./actions";
import { CapacityForm, SpecialHoursForm, WeeklyHoursForm } from "./hours-forms";

export const metadata: Metadata = { title: "Hours and Capacity" };

const back = <BackLink href="/manage">Manage</BackLink>;

export default function ManageHoursPage() {
  return (
    <main id="main" className="page-width flex-1 py-10">
      <Suspense
        fallback={
          <>
            <PageHeader back={back} title="Hours and Capacity" size="staff" />
            <p className="mt-4">Loading...</p>
          </>
        }
      >
        <Editor />
      </Suspense>
    </main>
  );
}

const button =
  "min-h-12 rounded-full px-6 font-semibold bg-primary text-primary-foreground";

async function Editor() {
  await requireStaff("manager", "/manage/hours");
  const at = now();
  const [hours, day] = await Promise.all([
    getHoursForStaff(at),
    getOrderingDay(at),
  ]);
  const state = orderingState(at, day);
  return (
    <div className="grid gap-8">
      <PageHeader
        back={back}
        title="Hours and Capacity"
        size="staff"
        actions={
          state.canOrder ? (
            <Pill tone="success">Taking orders</Pill>
          ) : state.reason === "paused" ? (
            <Pill tone="warning">Paused until {formatTime(state.until)}</Pill>
          ) : (
            <Pill tone="muted">Not taking orders</Pill>
          )
        }
      />
      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] 2xl:items-start">
        <div className="grid gap-8">
          <Panel
            id="pause"
            title="Ordering Paused"
            icon={<PauseCircleIcon size={20} />}
          >
            {hours.pausedUntil ? (
              <form
                action={resumeAction}
                className="grid justify-items-start gap-3"
              >
                <p role="status" className="text-warning font-semibold">
                  New Orders are paused until {formatTime(hours.pausedUntil)}.
                  {hours.pauseMessage && ` "${hours.pauseMessage}"`}
                </p>
                <button type="submit" className={button}>
                  Resume ordering
                </button>
              </form>
            ) : (
              <form action={pauseAction} className="grid max-w-xl gap-4">
                <p className="text-muted-foreground max-w-measure">
                  The menu stays up; checkout says when ordering is back.
                </p>
                <Field name="minutes" label="Pause for">
                  {(control) => (
                    <select
                      {...control}
                      defaultValue="30"
                      className="rounded-card border-input bg-background min-h-11 w-full border px-3"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  )}
                </Field>
                <Field
                  name="message"
                  label="Message for Customers"
                  hint="Shown at checkout while ordering is paused."
                  defaultValue="The bar is swamped. Back soon, salamat!"
                  maxLength={160}
                />
                <button
                  type="submit"
                  className={`${button} justify-self-start`}
                >
                  Pause ordering
                </button>
              </form>
            )}
          </Panel>

          <Panel
            id="special"
            title="Special Hours"
            icon={<CalendarStarIcon size={20} />}
          >
            {hours.special.length > 0 ? (
              <ul className="border-border border-t">
                {hours.special.map((s) => (
                  <li
                    key={s.day}
                    className="border-border flex flex-wrap items-center justify-between gap-3 border-b py-2"
                  >
                    <span>
                      <span className="font-mono text-sm">
                        {formatDate(new Date(`${s.day}T04:00:00Z`))}
                      </span>{" "}
                      {s.isClosed || !s.opensAt || !s.closesAt
                        ? "Closed"
                        : `${formatClock(s.opensAt)} to ${formatClock(s.closesAt)}`}
                      {s.note && `, ${s.note}`}
                    </span>
                    <form action={deleteSpecialHoursAction}>
                      <input type="hidden" name="day" value={s.day} />
                      <button
                        type="submit"
                        className="border-input min-h-11 rounded-full border px-4 text-sm"
                      >
                        Remove<span className="sr-only"> {s.day}</span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty icon={<CalendarPlusIcon size={24} />}>
                <p>
                  No Special Hours coming up. Add one for a holiday or a coffee
                  festival.
                </p>
              </Empty>
            )}
            <div className="mt-6">
              <SpecialHoursForm today={manila(at).day} />
            </div>
          </Panel>
        </div>

        <div className="grid gap-8">
          <Panel
            id="weekly"
            title="Opening Hours"
            icon={<ClockIcon size={20} />}
          >
            <p className="text-muted-foreground max-w-measure">
              Manila time. Customers see these on the{" "}
              <Link href="/cafe">Visit page</Link>.
            </p>
            <div className="mt-4">
              <WeeklyHoursForm weekly={hours.weekly} />
            </div>
          </Panel>

          <Panel
            id="capacity"
            title="Capacity and Prep Time"
            icon={<GaugeIcon size={20} />}
          >
            <p className="text-muted-foreground max-w-measure">
              How much the bar can finish in one 15-minute Pickup Window.
            </p>
            <div className="mt-4">
              <CapacityForm
                capacity={hours.capacity}
                prep={hours.prep}
                example={prepMinutes(4, hours.prep)}
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
