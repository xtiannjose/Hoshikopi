"use client";

import { useActionState } from "react";

import { Field, fieldClass, SaveBar } from "@/components/manage/fields";
import type { Hours } from "@/lib/hours";

import {
  saveCapacityAction,
  saveSpecialHoursAction,
  saveWeeklyHoursAction,
  type FormState,
} from "./actions";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const idle: FormState = { status: "idle" };
const cell = `${fieldClass} min-w-28`;

export function WeeklyHoursForm({ weekly }: { weekly: Hours["weekly"] }) {
  const [state, action, pending] = useActionState(saveWeeklyHoursAction, idle);
  return (
    <form action={action} className="grid gap-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left">
          <caption className="sr-only">Opening Hours by day</caption>
          <thead>
            <tr className="text-muted-foreground text-sm">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Day
              </th>
              <th scope="col" className="pr-3 font-semibold">
                Closed
              </th>
              <th scope="col" className="pr-3 font-semibold">
                Opens
              </th>
              <th scope="col" className="pr-3 font-semibold">
                Last order
              </th>
              <th scope="col" className="font-semibold">
                Closes
              </th>
            </tr>
          </thead>
          <tbody>
            {weekly.map((day) => {
              const name = DAYS[day.weekday];
              const error = state.errors?.[String(day.weekday)];
              return (
                <tr
                  key={day.weekday}
                  className="border-border border-t align-top"
                >
                  <th scope="row" className="py-3 pr-3 font-semibold">
                    {name}
                    {error && (
                      <p className="text-destructive text-sm font-normal">
                        {error}
                      </p>
                    )}
                  </th>
                  <td className="py-3 pr-3">
                    <input
                      type="checkbox"
                      name={`closed-${day.weekday}`}
                      defaultChecked={day.isClosed}
                      aria-label={`${name} closed`}
                      className="size-5"
                    />
                  </td>
                  {(
                    [
                      ["opens", "opensAt", "opens"],
                      ["last", "lastOrderAt", "last order"],
                      ["closes", "closesAt", "closes"],
                    ] as const
                  ).map(([prefix, key, label]) => (
                    <td key={prefix} className="py-3 pr-3">
                      <input
                        type="time"
                        step={900}
                        name={`${prefix}-${day.weekday}`}
                        defaultValue={day[key]}
                        aria-label={`${name} ${label}`}
                        aria-invalid={error ? true : undefined}
                        className={cell}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <SaveBar
        pending={pending}
        status={state.status}
        label="Save Opening Hours"
      />
    </form>
  );
}

export function SpecialHoursForm() {
  const [state, action, pending] = useActionState(saveSpecialHoursAction, idle);
  return (
    <form action={action} className="grid max-w-3xl gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="day" label="Date" type="date" error={state.errors?.day} />
        <Field
          name="note"
          label="Why (shown to Customers)"
          error={state.errors?.note}
        />
      </div>
      <label className="inline-flex min-h-11 items-center gap-2">
        <input type="checkbox" name="isClosed" className="size-5" />
        Closed all day
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          name="opensAt"
          label="Opens"
          type="time"
          step={900}
          defaultValue="10:00"
        />
        <Field
          name="lastOrderAt"
          label="Last order"
          type="time"
          step={900}
          defaultValue="17:30"
          error={state.errors?.lastOrderAt}
        />
        <Field
          name="closesAt"
          label="Closes"
          type="time"
          step={900}
          defaultValue="18:00"
        />
      </div>
      <SaveBar
        pending={pending}
        status={state.status}
        label="Add Special Hours"
      />
    </form>
  );
}

export function CapacityForm({
  capacity,
  prep,
}: {
  capacity: { weekday: number; drinks: number; food: number }[];
  prep: { baseMinutes: number; perDrinkMinutes: number };
}) {
  const [state, action, pending] = useActionState(saveCapacityAction, idle);
  return (
    <form action={action} className="grid gap-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left">
          <caption className="sr-only">
            Capacity per 15-minute Pickup Window
          </caption>
          <thead>
            <tr className="text-muted-foreground text-sm">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Day
              </th>
              <th scope="col" className="pr-3 font-semibold">
                Drinks per window
              </th>
              <th scope="col" className="font-semibold">
                Food Lines per window
              </th>
            </tr>
          </thead>
          <tbody>
            {capacity.map((row) => {
              const name = DAYS[row.weekday];
              const error = state.errors?.[String(row.weekday)];
              return (
                <tr
                  key={row.weekday}
                  className="border-border border-t align-top"
                >
                  <th scope="row" className="py-3 pr-3 font-semibold">
                    {name}
                    {error && (
                      <p className="text-destructive text-sm font-normal">
                        {error}
                      </p>
                    )}
                  </th>
                  <td className="py-3 pr-3">
                    <input
                      type="number"
                      min={0}
                      max={200}
                      name={`drinks-${row.weekday}`}
                      defaultValue={row.drinks}
                      aria-label={`${name} drinks per window`}
                      className={cell}
                    />
                  </td>
                  <td className="py-3">
                    <input
                      type="number"
                      min={0}
                      max={200}
                      name={`food-${row.weekday}`}
                      defaultValue={row.food}
                      aria-label={`${name} food Lines per window`}
                      className={cell}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <fieldset className="grid max-w-xl gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-semibold">
          Prep Time: base + minutes per drink queued ahead
        </legend>
        <Field
          name="baseMinutes"
          label="Base minutes"
          inputMode="decimal"
          defaultValue={prep.baseMinutes}
          error={state.errors?.baseMinutes}
        />
        <Field
          name="perDrinkMinutes"
          label="Minutes per drink ahead"
          inputMode="decimal"
          defaultValue={prep.perDrinkMinutes}
          error={state.errors?.perDrinkMinutes}
        />
      </fieldset>
      <SaveBar pending={pending} status={state.status} label="Save Capacity" />
    </form>
  );
}
