import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ConceptNotice } from "@/components/concept-notice";
import { FocusOnNavigate } from "@/components/shell/focus-on-navigate";
import { KeepFocus } from "@/components/shell/keep-focus";
import { Logo } from "@/components/shell/logo";
import { ThemeSwitch } from "@/components/theme-switch";

export const metadata: Metadata = {
  title: { template: "%s | Staff | Hoshikopi", default: "Staff | Hoshikopi" },
  robots: { index: false },
};

// The Staff frame: no Cart or customer navigation. Staff goes back up to the
// Manage home; the Manage home and two-factor carry the link to the account.
export default function ManageLayout({ children }: LayoutProps<"/manage">) {
  return (
    <>
      <header className="border-border border-b">
        <div className="page-width flex flex-wrap items-center gap-3 py-3">
          <Link href="/" aria-label="Hoshikopi home" className="no-underline">
            <Logo />
          </Link>
          <Link
            href="/manage"
            className="text-muted-foreground inline-flex min-h-11 items-center text-sm font-semibold no-underline hover:underline"
          >
            Staff
          </Link>
          {/* At every width: pinning Day or Night is for comfort and
              access, as in the public header's phone menu (audit DC-23). */}
          <div className="ml-auto">
            <ThemeSwitch name="theme-staff" />
          </div>
        </div>
      </header>
      {children}
      <ConceptNotice className="page-width py-6" />
      {/* As on the customer pages (a11y:3, a11y:5): a removed row hands
          focus on, and a new page takes it (audit DC-20). */}
      <KeepFocus />
      <Suspense>
        <FocusOnNavigate />
      </Suspense>
    </>
  );
}
