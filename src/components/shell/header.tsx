import Link from "next/link";
import { Suspense } from "react";
import { ListIcon, XIcon } from "@phosphor-icons/react/ssr";

import { ThemeSwitch } from "@/components/theme-switch";

import { CartButton, CartLink } from "./cart-button";
import { Logo } from "./logo";
import { MenuLink } from "./menu-link";
import { NAV_LINKS } from "./nav-links";

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
      <Link href="/" aria-label="Hoshikopi home" className="no-underline">
        <Logo />
      </Link>
      <nav aria-label="Main" className="hidden lg:block">
        <ul className="flex gap-8 font-medium">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="no-underline hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-3 lg:gap-5">
        <div className="hidden lg:block">
          <ThemeSwitch name="theme-header" />
        </div>
        <Link
          href="/sign-in"
          className="hidden font-medium no-underline hover:underline lg:inline"
        >
          Sign in
        </Link>
        <Suspense fallback={<CartLink />}>
          <CartButton />
        </Suspense>
        <button
          type="button"
          popoverTarget="site-menu"
          aria-label="Open the menu"
          className="border-input grid size-11 place-items-center rounded-full border lg:hidden"
        >
          <ListIcon aria-hidden size={20} />
        </button>
      </div>
      <div
        id="site-menu"
        popover="auto"
        className="bg-background text-foreground m-0 ml-auto h-dvh w-[min(22rem,100vw)] p-6 shadow-xl backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            popoverTarget="site-menu"
            popoverTargetAction="hide"
            aria-label="Close the menu"
            className="border-input grid size-11 place-items-center rounded-full border"
          >
            <XIcon aria-hidden size={20} />
          </button>
        </div>
        <nav aria-label="Menu" className="mt-8">
          <ul className="grid gap-1 text-xl">
            {[...NAV_LINKS, { href: "/sign-in", label: "Sign in" }].map(
              (link) => (
                <li key={link.href}>
                  <MenuLink href={link.href} label={link.label} />
                </li>
              )
            )}
          </ul>
        </nav>
        <div className="mt-8">
          <ThemeSwitch name="theme-menu" />
        </div>
      </div>
    </header>
  );
}
