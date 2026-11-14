import Link from "next/link";
import { ArrowUpIcon } from "@phosphor-icons/react/ssr";

import { Divider } from "@/components/home/divider";
import { getCafeContact } from "@/modules/cafe";

import { Logo } from "./logo";

// No link name may contain "Cart" (home.spec finds the Cart button by /Cart/).
const LISTS = [
  {
    id: "footer-order",
    label: "Order",
    links: [
      { href: "/menu", label: "Menu" },
      { href: "/account/stars", label: "Stars" },
      { href: "/account", label: "Your account" },
    ],
  },
  {
    id: "footer-cafe",
    label: "The cafe",
    links: [
      { href: "/cafe", label: "Visit" },
      { href: "/events", label: "Events" },
      { href: "/news", label: "News" },
    ],
  },
  {
    id: "footer-fine-print",
    label: "Fine print",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "/concept", label: "About this concept" },
    ],
  },
];

const TAP = "inline-flex min-h-11 items-center";

export async function Footer() {
  const { area, contactEmail } = await getCafeContact();
  return (
    <footer className="page-width mt-24 pb-10">
      <Divider className="mb-8" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="font-display text-2xl italic">
            Salamat sa pagdaan. See you at the counter.
          </p>
        </div>
        <nav aria-label="Footer" className="grid gap-4 md:grid-cols-3 md:gap-6">
          {LISTS.map((list) => (
            <div key={list.id}>
              <p
                id={list.id}
                className="text-muted-foreground font-mono text-sm"
              >
                {list.label}
              </p>
              <ul
                aria-labelledby={list.id}
                className="flex flex-wrap gap-x-6 md:mt-2 md:grid md:gap-0"
              >
                {list.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`${TAP} no-underline hover:underline`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <p className="text-muted-foreground mt-8 flex flex-wrap items-center gap-x-4">
        <span>{area}.</span>
        <a href={`mailto:${contactEmail}`} className={`${TAP} text-foreground`}>
          {contactEmail}
        </a>
        <Link href="/cafe" className={`${TAP} text-foreground`}>
          Hours and directions
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6">
        <p className="text-muted-foreground font-mono text-sm">
          Hoshikopi is a concept cafe. Orders and payments here are for
          demonstration. <Link href="/concept">About this concept</Link>
        </p>
        <a
          href="#main"
          className={`${TAP} gap-2 text-sm no-underline hover:underline`}
        >
          <ArrowUpIcon aria-hidden size={16} />
          Back to top
        </a>
      </div>
    </footer>
  );
}
