import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Field } from "@/components/manage/fields";
import { formatDate, formatTime, now } from "@/lib/clock";
import { formatClock } from "@/lib/hours";
import { getHoursForStaff } from "@/modules/cafe";
import { requireStaff } from "@/modules/identity";

import { deleteSpecialHoursAction, pauseAction, resumeAction } from "./actions";
import { CapacityForm, SpecialHoursForm, WeeklyHoursForm } from "./hours-forms";

export const metadata: Metadata = { title: "Hours and Capacity" };

export default function ManageHoursPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Link href="/manage">Manage</Link>
      <h1 className="font-display mt-4 pb-1 text-4xl italic">
        Hours and Capacity
      </h1>
      <Suspense fallback={<p className="mt-4">Loading...</p>}>
        <Editor />
      </Suspense>
    </main>
  );
}

const button =
  "min-h-12 rounded-full px-6 font-semibold bg-primary text-primary-foreground";

async function Editor() {
  await requireStaff("manager", "/manage/hours");
  const hours = await getHoursForStaff(now());
  return (
    <div className="mt-8 grid gap-14">
      <section aria-labelledby="pause">
        <h2 id="pause" className="font-display text-2xl italic">
          Ordering Paused
        </h2>
        {hours.pausedUntil ? (
          <form
            action={resumeAction}
            className="mt-4 grid justify-items-start gap-3"
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
          <form action={pauseAction} className="mt-4 grid max-w-xl gap-4">
            <p className="text-muted-foreground">
              The menu stays up; checkout says when ordering is back.
            </p>
            <Field name="minutes" label="Pause for">
              <select
                id="minutes"
                name="minutes"
                defaultValue="30"
                className="rounded-card border-input bg-background min-h-11 w-full border px-3"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </Field>
            <Field
              name="message"
              label="Message for Customers"
              defaultValue="The bar is swamped. Back soon, salamat!"
              maxLength={160}
            />
            <button type="submit" className={`${button} justify-self-start`}>
              Pause ordering
            </button>
          </form>
        )}
      </section>

      <section aria-labelledby="weekly">
        <h2 id="weekly" className="font-display text-2xl italic">
          Opening Hours
        </h2>
        <p className="text-muted-foreground mt-1">Manila time.</p>
        <div className="mt-4">
          <WeeklyHoursForm weekly={hours.weekly} />
        </div>
      </section>

      <section aria-labelledby="special">
        <h2 id="special" className="font-display text-2xl italic">
          Special Hours
        </h2>
        {hours.special.length > 0 && (
          <ul className="border-border mt-4 border-t">
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
        )}
        <div className="mt-6">
          <SpecialHoursForm />
        </div>
      </section>

      <section aria-labelledby="capacity">
        <h2 id="capacity" className="font-display text-2xl italic">
          Capacity and Prep Time
        </h2>
        <p className="text-muted-foreground mt-1">
          How much the bar can finish in one 15-minute Pickup Window.
        </p>
        <div className="mt-4">
          <CapacityForm capacity={hours.capacity} prep={hours.prep} />
        </div>
      </section>
    </div>
  );
}
