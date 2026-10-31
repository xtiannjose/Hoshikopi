import Link from "next/link";

import { getCafeContact } from "@/modules/cafe";

import { Logo } from "./logo";
import { NAV_LINKS } from "./nav-links";

export async function Footer() {
  const { area, contactEmail } = await getCafeContact();
  return (
    <footer className="border-border mx-auto mt-24 w-full max-w-7xl border-t px-4 pt-8 pb-10 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-7 gap-y-2">
            {[
              ...NAV_LINKS,
              { href: "/account", label: "Your account" },
              { href: "/concept", label: "About this concept" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="no-underline hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="text-muted-foreground mt-6">
        {area}.{" "}
        <a href={`mailto:${contactEmail}`} className="text-foreground">
          {contactEmail}
        </a>
      </p>
      <p className="text-muted-foreground mt-3 font-mono text-sm">
        Hoshikopi is a concept cafe. Orders and payments here are for
        demonstration. <Link href="/concept">About this concept</Link>
      </p>
    </footer>
  );
}
