"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { IconCircle } from "@/components/panel";

import { isCurrent, MENU_LINK_CLASS } from "./nav-classes";

/** A link in the phone menu: the layout stays mounted, so close the menu. */
export function MenuLink({
  href,
  children,
  icon,
  "aria-label": label,
}: {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  "aria-label"?: string;
}) {
  const path = usePathname();
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isCurrent(path, href) ? "page" : undefined}
      onClick={(event) =>
        event.currentTarget.closest<HTMLElement>("[popover]")?.hidePopover()
      }
      className={MENU_LINK_CLASS}
    >
      {icon && <IconCircle>{icon}</IconCircle>}
      {children}
    </Link>
  );
}
