"use client";

import Link from "next/link";
import { useEffect } from "react";

import { PageHeader } from "@/components/page-header";
import { OUTLINE_PILL, PRIMARY_PILL } from "@/components/panel";

/**
 * What an error boundary shows inside its frame (the frame keeps the header
 * and the Concept Notice): try again, or a way on. A server error comes with
 * a digest that matches the server log, so it is shown for a bug report.
 */
export function ErrorPanel({
  error,
  retry,
  home,
}: {
  error: unknown;
  retry: () => void;
  home: { href: string; label: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest =
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : null;
  return (
    <main id="main" className="page-width flex-1 pt-8 pb-16">
      {/* Error boundaries cannot export metadata (audit a11y:9). */}
      <title>Something went wrong | Hoshikopi</title>
      <PageHeader
        eyebrow="Something went wrong"
        title="Sorry, that didn't work"
        intro="Something broke on our side, not yours. Try again, and if it keeps happening, start over from here."
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => retry()} className={PRIMARY_PILL}>
          Try again
        </button>
        <Link href={home.href} className={OUTLINE_PILL}>
          {home.label}
        </Link>
      </div>
      {digest && (
        <p className="text-muted-foreground mt-6 font-mono text-sm">
          Error code {digest}
        </p>
      )}
    </main>
  );
}
