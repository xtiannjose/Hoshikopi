import type {
  FocusEvent,
  InputHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";

export const fieldClass =
  "rounded-card border-input bg-background min-h-11 w-full border px-3 py-2";

/** What ties a control to its label, hint and error. */
export type Control = {
  id: string;
  name: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/**
 * Label above, error below and tied to the input (docs/05 section 10). For
 * a select or a textarea, pass a function that spreads `control` on it, so
 * the hint and error reach it too (audit architecture:8). An
 * aria-describedby or aria-invalid given here adds to Field's own.
 */
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
  children?: (control: Control) => ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "children">) {
  const id = `${input.id ?? name}`;
  const control: Control = {
    id,
    name,
    "aria-invalid": error || input["aria-invalid"] ? true : undefined,
    "aria-describedby":
      [input["aria-describedby"], hint && `${id}-hint`, error && `${id}-error`]
        .filter(Boolean)
        .join(" ") || undefined,
  };
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
      {children ? (
        children(control)
      ) : (
        <input {...input} {...control} className={fieldClass} />
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
  savedText = "Saved.",
}: {
  pending: boolean;
  label: string;
  status: "idle" | "saved" | "error";
  savedText?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="submit"
        {...busy(pending)}
        className="bg-primary text-primary-foreground min-h-12 rounded-full px-6 font-semibold aria-disabled:opacity-60"
      >
        {pending ? "Saving..." : label}
      </button>
      <p role="status" className="font-semibold">
        {status === "saved" && savedText}
        {status === "error" && (
          <span className="text-destructive">Some fields need a fix.</span>
        )}
      </p>
    </div>
  );
}

/**
 * A submit button while its form is pending. `disabled` would drop keyboard
 * focus to <body> the moment it is pressed (audit a11y:5), so the button
 * stays focusable, says it is unavailable, and ignores another press.
 * Style it with aria-disabled:, not disabled:.
 */
export function busy(pending: boolean, onPress?: () => void) {
  return {
    "aria-disabled": pending || undefined,
    onClick: (event: MouseEvent) => {
      if (pending) event.preventDefault();
      else onPress?.();
    },
  };
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

/** A Web address from a Name or Title: "Café Ube Latte!" is
 * "cafe-ube-latte". */
function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** onBlur of a Name or Title on a new record: fills an empty Web address
 * (the form's "slug" field). */
export function fillSlug(event: FocusEvent<HTMLInputElement>) {
  const slug = event.currentTarget.form?.elements.namedItem("slug");
  if (slug instanceof HTMLInputElement && !slug.value) {
    slug.value = slugify(event.currentTarget.value);
  }
}
