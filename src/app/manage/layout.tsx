import type { Metadata } from "next";
import Link from "next/link";

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
        <div className="page-width flex items-center gap-3 py-3">
          <Link href="/" aria-label="Hoshikopi home" className="no-underline">
            <Logo />
          </Link>
          <Link
            href="/manage"
            className="text-muted-foreground inline-flex min-h-11 items-center text-sm font-semibold no-underline hover:underline"
          >
            Staff
          </Link>
          <div className="ml-auto hidden lg:block">
            <ThemeSwitch name="theme-staff" />
          </div>
        </div>
      </header>
      {children}
      <p className="page-width text-muted-foreground py-6 font-mono text-sm">
        Hoshikopi is a concept cafe. Orders and payments here are for
        demonstration. <Link href="/concept">About this concept</Link>
      </p>
    </>
  );
}
