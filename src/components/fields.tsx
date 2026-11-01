import type { InputHTMLAttributes, ReactNode } from "react";

export const fieldClass =
  "rounded-card border-input bg-background min-h-11 w-full border px-3 py-2";

/** Label above, error below and tied to the input (docs/05 section 10). */
export function Field({
  name,
  label,
  error,
  hint,
  children,
  ...input
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = `${input.id ?? name}`;
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-muted-foreground text-sm">
          {hint}
        </p>
      )}
      {children ?? (
        <input
          {...input}
          id={id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={fieldClass}
        />
      )}
      {error && (
        <p id={`${id}-error`} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

/** A group of native checkboxes with a legend. */
export function Checkboxes({
  legend,
  name,
  options,
  checked,
  error,
}: {
  legend: string;
  name: string;
  options: readonly (readonly [value: string, label: string])[];
  checked: string[];
  error?: string;
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="font-semibold">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        {options.map(([value, label]) => (
          <label
            key={value}
            className="inline-flex min-h-11 items-center gap-2"
          >
            <input
              type="checkbox"
              name={name}
              value={value}
              defaultChecked={checked.includes(value)}
              className="size-5"
            />
            {label}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function SaveBar({
  pending,
  label,
  status,
}: {
  pending: boolean;
  label: string;
  status: "idle" | "saved" | "error";
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground min-h-12 rounded-full px-6 font-semibold disabled:opacity-60"
      >
        {pending ? "Saving..." : label}
      </button>
      <p role="status" className="font-semibold">
        {status === "saved" && "Saved."}
        {status === "error" && (
          <span className="text-destructive">Some fields need a fix.</span>
        )}
      </p>
    </div>
  );
}

export const ALLERGEN_LABELS = [
  ["milk", "Milk"],
  ["egg", "Egg"],
  ["wheat", "Wheat"],
  ["soy", "Soy"],
  ["peanuts", "Peanuts"],
  ["tree_nuts", "Tree nuts"],
  ["fish", "Fish"],
  ["shellfish", "Shellfish"],
  ["sesame", "Sesame"],
] as const;
