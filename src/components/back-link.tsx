import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";

/** The way back or up on every page. The text is the parent's name
 * ("Menu", "Your account"), never an Order Code or a Menu Item name. */
export function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 justify-self-start text-base no-underline hover:underline"
    >
      <ArrowLeftIcon aria-hidden size={18} />
      {children}
    </Link>
  );
}
