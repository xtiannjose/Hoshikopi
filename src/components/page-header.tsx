import type { ReactNode } from "react";

/**
 * How a plain page starts: the way back, an eyebrow, the h1 with its
 * actions beside it, and a short intro at the measure (max-w-measure). Pills and links go in
 * actions, never in the h1 (tests read its text exactly).
 */
export function PageHeader({
  back,
  eyebrow,
  title,
  intro,
  actions,
  size = "page",
}: {
  back?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  actions?: ReactNode;
  size?: "page" | "staff";
}) {
  return (
    <header className="grid gap-2">
      {back}
      {eyebrow && (
        <p className="text-muted-foreground font-mono text-sm">{eyebrow}</p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <h1
          className={`font-display pb-1 leading-[1.1] italic ${size === "staff" ? "text-4xl" : "text-5xl md:text-6xl"}`}
        >
          {title}
        </h1>
        {actions && (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>
      {intro && (
        <p
          className={`text-muted-foreground max-w-measure ${size === "staff" ? "" : "text-lg"}`}
        >
          {intro}
        </p>
      )}
    </header>
  );
}
