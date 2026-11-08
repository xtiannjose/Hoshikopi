import type { ReactNode } from "react";

// No "use client" and no server-only imports: client forms use the pill
// classes too.

export const PRIMARY_PILL =
  "bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-semibold no-underline hover:opacity-90 disabled:opacity-60";
export const OUTLINE_PILL =
  "border-input hover:bg-muted inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 font-semibold no-underline disabled:opacity-60";

/** A Phosphor icon (20 px in md, 24 px in lg) in a round wash. Use tone
 * "background" on a bg-muted surface. */
export function IconCircle({
  children,
  size = "md",
  tone = "muted",
}: {
  children: ReactNode;
  size?: "md" | "lg";
  tone?: "muted" | "background";
}) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full ${size === "lg" ? "size-12" : "size-10"} ${tone === "background" ? "bg-background" : "bg-muted"}`}
    >
      {children}
    </span>
  );
}

/** An outlined section: an icon, its heading, then the content. The
 * section is a region named by its title. */
export function Panel({
  id,
  title,
  icon,
  aside,
  headingLevel = 2,
  className,
  children,
}: {
  id: string;
  title: ReactNode;
  icon: ReactNode;
  aside?: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  const H = headingLevel === 3 ? "h3" : "h2";
  return (
    <section
      aria-labelledby={id}
      className={`rounded-card border-border border p-5 md:p-6 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <IconCircle>{icon}</IconCircle>
        <H id={id} className="font-display scroll-mt-6 text-3xl italic">
          {title}
        </H>
        {aside && (
          <div className="text-muted-foreground ml-auto text-sm">{aside}</div>
        )}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** A warm empty state: a line of copy, then the next step (a link or pill). */
export function Empty({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-muted rounded-card flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
      <IconCircle size="lg" tone="background">
        {icon}
      </IconCircle>
      <div className="grid justify-items-start gap-3">{children}</div>
    </div>
  );
}

const PILL_TONE = {
  plain: "border-input",
  muted: "border-border text-muted-foreground",
  success: "border-success text-success",
  warning: "border-warning text-warning",
  destructive: "border-destructive text-destructive",
  primary: "border-primary",
};

/** A small outlined status label. */
export function Pill({
  tone = "plain",
  children,
}: {
  tone?: keyof typeof PILL_TONE;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PILL_TONE[tone]}`}
    >
      {children}
    </span>
  );
}
