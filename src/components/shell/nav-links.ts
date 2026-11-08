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

export { isCurrent, MENU_LINK_CLASS, NAV_LINK_CLASS } from "./nav-classes";
