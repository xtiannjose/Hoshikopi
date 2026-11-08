"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isCurrent, NAV_LINK_CLASS } from "./nav-classes";

/** A Main nav link, underlined while you are in its section. usePathname
 * suspends on routes with fallback params, so callers wrap it in Suspense. */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const path = usePathname();
  return (
    <Link
      href={href}
      aria-current={isCurrent(path, href) ? "page" : undefined}
      className={NAV_LINK_CLASS}
    >
      {children}
    </Link>
  );
}
