"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/** A link inside a popover drawer: the layout stays mounted, so close it. */
export function PopoverLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={(event) =>
        event.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover()
      }
      className={className}
    >
      {children}
    </Link>
  );
}
