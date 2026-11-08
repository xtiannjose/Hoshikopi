import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { OUTLINE_PILL, PRIMARY_PILL } from "@/components/panel";

/** A 404 inside whichever frame it lands in, with the next places to go. */
export function NotFoundBody({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  return (
    <main id="main" className="page-width flex-1 pt-8 pb-16">
      <PageHeader
        eyebrow="404"
        title="This page could not be found"
        intro="It may have moved, or the link has a typo."
      />
      <ul className="mt-6 flex flex-wrap gap-3">
        {links.map((link, index) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={index === 0 ? PRIMARY_PILL : OUTLINE_PILL}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
