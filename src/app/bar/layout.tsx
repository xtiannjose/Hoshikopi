import type { Metadata } from "next";

import { ConceptNotice } from "@/components/concept-notice";

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
      <ConceptNotice className="px-4 py-3 lg:px-6" />
    </div>
  );
}
