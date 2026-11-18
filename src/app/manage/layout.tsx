import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShootingStarIcon } from "@phosphor-icons/react/ssr";

import { ConceptNotice } from "@/components/concept-notice";
import { FocusOnNavigate } from "@/components/shell/focus-on-navigate";
import { HeaderHeight } from "@/components/shell/header-height";
import { KeepFocus } from "@/components/shell/keep-focus";
import { Logo } from "@/components/shell/logo";
import { ThemeSwitch } from "@/components/theme-switch";

export const metadata: Metadata = {
  title: { template: "%s | Staff | Hoshikopi", default: "Staff | Hoshikopi" },
  robots: { index: false },
};

// The Staff frame: no Cart or customer navigation. The logo goes back up to
// the Manage home, and "Back to the site" (a shooting star heading back) to
// the customer site (owner, 2026-11-18, batch 12.6); the Manage home and
// two-factor carry the link to the account. The header stays at the top
// while a page scrolls, as the customer one does (12.1).
export default function ManageLayout({ children }: LayoutProps<"/manage">) {
  return (
    <>
      <header className="site-header bg-background sticky top-0 z-30">
        <div className="page-width flex flex-wrap items-center gap-3 py-3">
          {/* Named by what it shows, "Hoshikopi Staff": a label that left out
              the visible words failed axe (label-content-name-mismatch). */}
          {/* On a phone "Staff" sits under the wordmark, so the header
              stays one row: a sticky band two rows tall took a third of
              the screen. */}
          <Link
            href="/manage"
            className="group inline-flex min-h-11 flex-col items-start no-underline sm:flex-row sm:items-center sm:gap-3"
          >
            <Logo />{" "}
            <span className="text-muted-foreground -mt-1 pl-8 text-xs leading-none font-semibold group-hover:underline sm:mt-0 sm:pl-0 sm:text-sm">
              Staff
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="group border-input hover:bg-muted inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-semibold no-underline sm:px-4"
            >
              {/* Mirrored, so the star flies back (left); it leans further
                  on hover. */}
              <ShootingStarIcon
                aria-hidden
                size={20}
                className="-scale-x-100 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
              />
              {/* The icon alone on a phone; the name stays for screen readers. */}
              <span className="max-sm:sr-only">Back to the site</span>
            </Link>
            {/* At every width: pinning Day or Night is for comfort and
                access, as in the public header's phone menu (audit DC-23). */}
            <ThemeSwitch name="theme-staff" />
          </div>
        </div>
        <HeaderHeight />
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
