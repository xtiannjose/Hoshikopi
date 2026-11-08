"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Shows its children everywhere but the given paths. */
export function HiddenOn({
  paths,
  children,
}: {
  paths: string[];
  children: ReactNode;
}) {
  const path = usePathname();
  return paths.includes(path) ? null : children;
}
