// Apart from nav-links.ts, whose icons would otherwise ship to the browser
// with every client link that needs these (7.6).
export const NAV_LINK_CLASS =
  "no-underline hover:underline decoration-input aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";
export const MENU_LINK_CLASS =
  "flex min-h-12 items-center gap-3 no-underline aria-[current=page]:font-semibold";

/** The link's section is the one you are in. */
export function isCurrent(path: string, href: string): boolean {
  return path === href || path.startsWith(href + "/");
}
