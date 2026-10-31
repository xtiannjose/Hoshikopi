import Link from "next/link";

import { Logo } from "@/components/shell/logo";

// The Staff frame: no Cart or customer navigation.
export default function ManageLayout({ children }: LayoutProps<"/manage">) {
  return (
    <>
      <header className="border-border flex items-center gap-3 border-b px-4 py-3 md:px-8">
        <Link href="/" aria-label="Hoshikopi home" className="no-underline">
          <Logo />
        </Link>
        <span className="text-muted-foreground text-sm font-semibold">
          Staff
        </span>
      </header>
      {children}
      <p className="text-muted-foreground px-4 py-6 font-mono text-sm md:px-8">
        Hoshikopi is a concept cafe. Orders and payments here are for
        demonstration.
      </p>
    </>
  );
}
