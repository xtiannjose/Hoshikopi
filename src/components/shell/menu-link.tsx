"use client";

import Link from "next/link";

/** A link in the phone menu: the layout stays mounted, so close the menu. */
export function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      onClick={(event) =>
        event.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover()
      }
      className="flex min-h-12 items-center no-underline"
    >
      {label}
    </Link>
  );
}
