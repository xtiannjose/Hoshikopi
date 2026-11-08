import {
  CalendarStarIcon,
  ForkKnifeIcon,
  StarIcon,
  StorefrontIcon,
} from "@phosphor-icons/react/ssr";

export const NAV_LINKS = [
  { href: "/menu", label: "Menu", icon: ForkKnifeIcon },
  { href: "/account/stars", label: "Stars", icon: StarIcon },
  { href: "/events", label: "Events", icon: CalendarStarIcon },
  { href: "/cafe", label: "Visit", icon: StorefrontIcon },
] as const;

// Here, not in the client links, so the server fallbacks can share them.
export const NAV_LINK_CLASS =
  "no-underline hover:underline decoration-input aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";
export const MENU_LINK_CLASS =
  "flex min-h-12 items-center gap-3 no-underline aria-[current=page]:font-semibold";

/** The link's section is the one you are in. */
export function isCurrent(path: string, href: string): boolean {
  return path === href || path.startsWith(href + "/");
}
