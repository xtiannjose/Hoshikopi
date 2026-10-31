"use client";

import { useActionState } from "react";

import type { CafeDetails } from "@/modules/cafe";

import { saveCafeAction, type CafeFormState } from "./actions";

const AMENITIES = [
  ["wifi", "Wi-Fi"],
  ["powerOutlets", "Power outlets"],
  ["petsAllowed", "Pets allowed"],
  ["smokingAllowed", "Smoking allowed"],
  ["restroom", "Restroom"],
  ["stepFreeEntrance", "Step-free entrance"],
  ["accessibleRestroom", "Accessible restroom"],
] as const;

const NOTES = [
  ["laptopNote", "Laptop note"],
  ["petsNote", "Pets note"],
  ["parkingNote", "Parking and the nearest car park"],
] as const;

const field =
  "rounded-card border-input bg-background min-h-11 w-full border px-3 py-2";

export function CafeForm({ cafe }: { cafe: CafeDetails }) {
  const [state, action, pending] = useActionState<CafeFormState, FormData>(
    saveCafeAction,
    { status: "idle" }
  );
  const error = (name: string) => state.errors?.[name];

  const text = (
    name: keyof CafeDetails,
    label: string,
    type = "text",
    extra: Record<string, string> = {}
  ) => (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={String(cafe[name] ?? "")}
        aria-invalid={error(name) ? true : undefined}
        aria-describedby={error(name) ? `${name}-error` : undefined}
        className={field}
        {...extra}
      />
      {error(name) && (
        <p id={`${name}-error`} className="text-destructive text-sm">
          {error(name)}
        </p>
      )}
    </div>
  );

  const area = (name: keyof CafeDetails, label: string, hint: string) => (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="font-semibold">
        {label}
      </label>
      <p id={`${name}-hint`} className="text-muted-foreground text-sm">
        {hint}
      </p>
      <textarea
        id={name}
        name={name}
        rows={5}
        defaultValue={String(cafe[name] ?? "")}
        aria-describedby={`${name}-hint${error(name) ? ` ${name}-error` : ""}`}
        aria-invalid={error(name) ? true : undefined}
        className={field}
      />
      {error(name) && (
        <p id={`${name}-error`} className="text-destructive text-sm">
          {error(name)}
        </p>
      )}
    </div>
  );

  return (
    <form action={action} className="mt-8 grid max-w-3xl gap-8">
      <fieldset className="grid gap-4">
        <legend className="font-display mb-2 text-2xl italic">
          Where and how to reach us
        </legend>
        {text("area", "Neighbourhood")}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("mapLat", "Map pin latitude", "text", { inputMode: "decimal" })}
          {text("mapLng", "Map pin longitude", "text", {
            inputMode: "decimal",
          })}
        </div>
        <p className="text-muted-foreground text-sm">
          Put the pin on a public spot nearby, never a home.
        </p>
        {text("contactEmail", "Email", "email")}
        {area(
          "directionsMd",
          "How to get here",
          "Markdown. No street address."
        )}
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="font-display mb-2 text-2xl italic">
          The space and the story
        </legend>
        {area(
          "spaceMd",
          "The space",
          "Seats, light, how it feels by day and by night."
        )}
        {area("storyMd", "Our story", "Markdown. Label every invented person.")}
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="font-display mb-2 text-2xl italic">Amenities</legend>
        <p className="text-muted-foreground text-sm">
          &quot;Leave it off&quot; hides an Amenity you are not sure about.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {AMENITIES.map(([name, label]) => (
            <div key={name} className="grid gap-1.5">
              <label htmlFor={name} className="font-semibold">
                {label}
              </label>
              <select
                id={name}
                name={name}
                defaultValue={
                  cafe[name] === null ? "unknown" : cafe[name] ? "yes" : "no"
                }
                className={field}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unknown">Leave it off</option>
              </select>
            </div>
          ))}
        </div>
        {NOTES.map(([name, label]) => (
          <div key={name}>{text(name, label)}</div>
        ))}
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground min-h-12 rounded-full px-6 font-semibold disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save cafe details"}
        </button>
        <p role="status" className="font-semibold">
          {state.status === "saved" && "Saved. The visit page shows it now."}
          {state.status === "error" && (
            <span className="text-destructive">
              Some fields need a fix. See the notes above.
            </span>
          )}
        </p>
      </div>
    </form>
  );
}
