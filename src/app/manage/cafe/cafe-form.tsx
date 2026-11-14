"use client";

import Link from "next/link";
import {
  useActionState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import {
  ListChecksIcon,
  MapPinIcon,
  StorefrontIcon,
} from "@phosphor-icons/react";

import { mapsUrl } from "@/components/cafe/maps";
import { IconCircle } from "@/components/panel";
import { useKeptForm } from "@/components/use-kept-form";
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
  const form = useKeptForm(action, state);
  const error = (name: string) => state.errors?.[name];

  const text = (
    name: keyof CafeDetails,
    label: string,
    type = "text",
    extra: InputHTMLAttributes<HTMLInputElement> = {}
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
    <form
      {...form}
      className="grid max-w-3xl gap-6 xl:max-w-none xl:grid-cols-2 xl:items-start"
    >
      {panel(
        "Where and how to reach us",
        <MapPinIcon size={20} />,
        <>
          {text("area", "Neighbourhood")}
          <div className="grid gap-4 sm:grid-cols-2">
            {text("mapLat", "Map pin latitude", "text", {
              inputMode: "decimal",
              required: true,
            })}
            {text("mapLng", "Map pin longitude", "text", {
              inputMode: "decimal",
              required: true,
            })}
          </div>
          <p className="text-muted-foreground max-w-measure text-sm">
            Put the pin on a public spot nearby, never a home.{" "}
            {/* A new tab keeps unsaved changes here. */}
            <a href={mapsUrl(cafe)} target="_blank" rel="noreferrer">
              Check the pin on a map
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
          {text("contactEmail", "Email", "email")}
          {area(
            "directionsMd",
            "How to get here",
            "Markdown. No street address."
          )}
        </>
      )}

      {panel(
        "Amenities",
        <ListChecksIcon size={20} />,
        <>
          <p className="text-muted-foreground max-w-measure text-sm">
            &quot;Leave it off&quot; hides an Amenity you are not sure about.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
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
        </>
      )}

      {panel(
        "The space and the story",
        <StorefrontIcon size={20} />,
        <div className="grid gap-4 xl:grid-cols-2">
          {area(
            "spaceMd",
            "The space",
            "Seats, light, how it feels by day and by night."
          )}
          {area(
            "storyMd",
            "Our story",
            "Markdown. Label every invented person."
          )}
        </div>,
        "xl:col-span-2"
      )}

      <div className="flex flex-wrap items-center gap-4 xl:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground min-h-12 rounded-full px-6 font-semibold disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save cafe details"}
        </button>
        <p role="status" className="font-semibold">
          {state.status === "saved" && "Saved. The Visit page shows it now."}
          {state.status === "error" && (
            <span className="text-destructive">
              Some fields need a fix. See the notes above.
            </span>
          )}
        </p>
        {state.status === "saved" && (
          <Link href="/cafe" className="font-semibold">
            See the Visit page
          </Link>
        )}
      </div>
    </form>
  );
}

/** An outlined fieldset with its icon beside the legend. */
function panel(
  title: string,
  icon: ReactNode,
  children: ReactNode,
  className = ""
) {
  return (
    <div
      className={`rounded-card border-border border p-5 md:p-6 ${className}`}
    >
      <fieldset className="grid min-w-0 gap-4">
        <legend className="font-display mb-2 flex items-center gap-3 text-2xl italic">
          <IconCircle>{icon}</IconCircle>
          {title}
        </legend>
        {children}
      </fieldset>
    </div>
  );
}
