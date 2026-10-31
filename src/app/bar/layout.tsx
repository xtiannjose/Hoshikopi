import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bar Screen",
  robots: { index: false },
};

// The Bar Screen keeps the Night palette at all hours (ADR 0010).
export default function BarLayout({ children }: LayoutProps<"/bar">) {
  return (
    <div
      data-theme="night"
      className="bg-background text-foreground flex min-h-dvh flex-1 flex-col"
    >
      {children}
      <p className="text-muted-foreground px-4 py-3 font-mono text-sm lg:px-6">
        Hoshikopi is a concept cafe. Orders and payments here are for
        demonstration.
      </p>
    </div>
  );
}
