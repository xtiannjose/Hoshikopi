import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ListIcon, XIcon } from "@phosphor-icons/react/ssr";

import { IconCircle } from "@/components/panel";
import { ThemeSwitch } from "@/components/theme-switch";
import { getCafeContact } from "@/modules/cafe";

import {
  AccountLink,
  AccountMenuLink,
  SignInLink,
  SignInMenuLink,
} from "./account-link";
import { CartButton, CartLink } from "./cart-button";
import { Logo } from "./logo";
import { MenuLink } from "./menu-link";
import { NavLink } from "./nav-link";
import { MENU_LINK_CLASS, NAV_LINK_CLASS, NAV_LINKS } from "./nav-links";

const SMALL_LINKS = [
  { href: "/news", label: "News" },
  { href: "/privacy", label: "Privacy" },
  { href: "/concept", label: "About this concept" },
];

export function Header() {
  return (
    <header className="page-width flex items-center justify-between gap-4 py-3">
      <Link href="/" aria-label="Hoshikopi home" className="no-underline">
        <Logo />
      </Link>
      <nav aria-label="Main" className="hidden lg:block">
        {/* usePathname suspends on routes with fallback params (Cache
            Components), so the prerendered shell shows plain links. */}
        <Suspense fallback={<MainNav live={false} />}>
          <MainNav live />
        </Suspense>
      </nav>
      <div className="flex items-center gap-3 lg:gap-5">
        <div className="hidden lg:block">
          <ThemeSwitch name="theme-header" />
        </div>
        <Suspense fallback={<SignInLink />}>
          <AccountLink />
        </Suspense>
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
        // open:flex, never plain flex: it would override the closed
        // popover's display: none.
        className="drawer bg-background text-foreground m-0 ml-auto h-dvh w-[min(22rem,100vw)] flex-col p-6 shadow-xl backdrop:bg-black/40 open:flex"
      >
        <Suspense fallback={<Drawer live={false} />}>
          <Drawer live />
        </Suspense>
      </div>
    </header>
  );
}

function MainNav({ live }: { live: boolean }) {
  return (
    <ul className="flex gap-8 font-medium">
      {NAV_LINKS.map((link) => (
        <li key={link.href}>
          {live ? (
            <NavLink href={link.href}>{link.label}</NavLink>
          ) : (
            <Link href={link.href} className={NAV_LINK_CLASS}>
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

/** The phone menu. Live links mark the current page and close the menu;
 * the plain ones are the prerendered fallback until the path is known. */
function Drawer({ live }: { live: boolean }) {
  const Item = live ? MenuLink : PlainMenuLink;
  return (
    <>
      <div className="flex items-center justify-between">
        <Item href="/" aria-label="Hoshikopi home">
          <Logo />
        </Item>
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
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Item href={href} icon={<Icon size={20} />}>
                {label}
              </Item>
            </li>
          ))}
          <li>
            {live ? (
              <Suspense fallback={<SignInMenuLink />}>
                <AccountMenuLink />
              </Suspense>
            ) : (
              <PlainMenuLink href="/sign-in">Sign in</PlainMenuLink>
            )}
          </li>
        </ul>
      </nav>
      <div className="mt-auto grid justify-items-start gap-4 pt-8">
        <ThemeSwitch name="theme-menu" />
        <Area />
        <ul className="text-muted-foreground flex flex-wrap gap-x-5 text-sm">
          {SMALL_LINKS.map((link) => (
            <li key={link.href}>
              <Item href={link.href}>{link.label}</Item>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function PlainMenuLink({
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
  return (
    <Link href={href} aria-label={label} className={MENU_LINK_CLASS}>
      {icon && <IconCircle>{icon}</IconCircle>}
      {children}
    </Link>
  );
}

async function Area() {
  const { area } = await getCafeContact();
  return <p className="text-muted-foreground text-sm">{area}</p>;
}
