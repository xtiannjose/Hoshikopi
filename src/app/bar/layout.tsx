import type { Metadata } from "next";
import { Suspense } from "react";

import { ConceptNotice } from "@/components/concept-notice";
import { FocusOnNavigate } from "@/components/shell/focus-on-navigate";
import { KeepFocus } from "@/components/shell/keep-focus";

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
      {/* As on the customer pages (a11y:3, a11y:5): a removed button hands
          focus on, and a new page takes it (audit DC-20). */}
      <KeepFocus />
      <Suspense>
        <FocusOnNavigate />
      </Suspense>
    </div>
  );
}
