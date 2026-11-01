"use client";

import { useActionState } from "react";

import { Field, fieldClass, SaveBar } from "@/components/fields";
import { useKeptForm } from "@/components/use-kept-form";

import {
  saveRecurringAction,
  type ContentFormState,
} from "../../content-actions";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type WeeklyFormData = {
  id: string | null;
  title: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  note: string;
  isPublished: boolean;
};

/** One Recurring Event, or a new one when `id` is null (EVT-03). */
export function WeeklyForm({ event }: { event: WeeklyFormData }) {
  const [state, action, pending] = useActionState<ContentFormState, FormData>(
    saveRecurringAction,
    { status: "idle" }
  );
  const form = useKeptForm(action, state);
  const key = event.id ?? "new";
  const error = (name: string) => state.errors?.[name];
  return (
    <form {...form} className="border-border grid gap-4 border-b pb-6">
      {event.id && <input type="hidden" name="id" value={event.id} />}
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field
          id={`title-${key}`}
          name="title"
          label="Title"
          defaultValue={event.title}
          error={error("title")}
        />
        <Field id={`weekday-${key}`} name="weekday" label="Day">
          <select
            id={`weekday-${key}`}
            name="weekday"
            defaultValue={event.weekday}
            className={fieldClass}
          >
            {DAYS.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`startsAt-${key}`}
          name="startsAt"
          label="Starts (Manila time)"
          type="time"
          defaultValue={event.startsAt}
          error={error("startsAt")}
        />
        <Field
          id={`endsAt-${key}`}
          name="endsAt"
          label="Ends"
          type="time"
          defaultValue={event.endsAt}
          error={error("endsAt")}
        />
      </div>
      <Field
        id={`note-${key}`}
        name="note"
        label="Note (optional)"
        maxLength={120}
        defaultValue={event.note}
        error={error("note")}
      />
      <label className="inline-flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={event.isPublished}
          className="size-5"
        />
        Shown on the site
      </label>
      <SaveBar
        pending={pending}
        status={state.status}
        label={event.id ? `Save ${event.title}` : "Add Recurring Event"}
      />
    </form>
  );
}
