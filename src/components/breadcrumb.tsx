import Link from "next/link";

/** Menu / Category / Menu Item: the only three-level public path. The last
 * item is the current page and has no href. */
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 font-mono text-sm">
        {items.map((item, index) => (
          // On phones the current page drops to its own row; the h1 just
          // below already names it, so it shows from sm up.
          <li
            key={item.label}
            className={`items-center gap-2 ${item.href ? "flex" : "hidden sm:flex"}`}
          >
            {index > 0 && (
              <span aria-hidden className="text-muted-foreground">
                /
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center no-underline hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="text-muted-foreground inline-flex min-h-11 items-center"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
